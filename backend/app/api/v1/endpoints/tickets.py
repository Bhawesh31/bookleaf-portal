from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.audit import TicketAuditEvent
from app.models.author import Author
from app.models.book import Book
from app.models.ticket import Ticket, TicketMessage
from app.models.user import User
from app.schemas.ticket import (
    TicketCreate,
    TicketMessageCreate,
    TicketMessageOut,
    TicketOutAuthor,
)
from app.services.ai_service import ai_service

router = APIRouter()


def generate_ticket_number(db: Session) -> str:
    count = db.query(Ticket).count() + 1
    return f"TKT-2026-{count:04d}"


@router.post("", response_model=TicketOutAuthor, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket_in: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "author" or not current_user.author_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only authors can create support tickets.",
        )

    author = current_user.author_profile

    # Verify book ownership if book_id provided
    book = None
    book_info = None
    if ticket_in.book_id:
        book = (
            db.query(Book)
            .filter(Book.id == ticket_in.book_id, Book.author_id == author.id)
            .first()
        )
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected book not found or does not belong to you.",
            )
        book_info = {
            "book_id": book.book_id,
            "title": book.title,
            "isbn": book.isbn,
            "genre": book.genre,
            "status": book.status,
            "total_copies_sold": book.total_copies_sold,
            "royalty_paid": float(book.royalty_paid),
            "royalty_pending": float(book.royalty_pending),
            "last_royalty_payout_date": str(book.last_royalty_payout_date) if book.last_royalty_payout_date else None,
        }

    # AI Auto-classification & Priority scoring (with graceful fallback)
    ai_result = await ai_service.classify_and_prioritize(
        subject=ticket_in.subject,
        description=ticket_in.description,
        book_info=book_info,
    )

    ticket_number = generate_ticket_number(db)

    ticket = Ticket(
        ticket_number=ticket_number,
        author_id=author.id,
        book_id=book.id if book else None,
        subject=ticket_in.subject,
        description=ticket_in.description,
        attachment_filename=ticket_in.attachment_filename,
        category=ai_result.category,
        priority=ai_result.priority,
        status="Open",
        classification_source=ai_result.source,
        priority_source=ai_result.source,
        ai_reasoning=ai_result.reasoning,
    )
    db.add(ticket)
    db.flush()

    # Create initial author query message in ticket thread
    initial_msg = TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        sender_role="author",
        content=ticket_in.description,
        message_type="author_query",
        is_published=True,
    )
    db.add(initial_msg)

    # Audit log
    audit = TicketAuditEvent(
        ticket_id=ticket.id,
        actor_id=current_user.id,
        action="TICKET_CREATED",
        new_values={
            "ticket_number": ticket_number,
            "category": ticket.category,
            "priority": ticket.priority,
            "classification_source": ai_result.source,
        },
    )
    db.add(audit)
    db.commit()
    db.refresh(ticket)

    return _format_author_ticket(ticket, author, book)


@router.get("", response_model=List[TicketOutAuthor])
def list_tickets(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Ticket)

    # Strict Author Scoping
    if current_user.role == "author":
        if not current_user.author_profile:
            return []
        query = query.filter(Ticket.author_id == current_user.author_profile.id)

    if status_filter:
        query = query.filter(Ticket.status == status_filter)

    tickets = query.order_by(desc(Ticket.created_at)).all()
    return [_format_author_ticket(t, t.author, t.book) for t in tickets]


@router.get("/{ticket_id}", response_model=TicketOutAuthor)
def get_ticket_detail(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found.",
        )

    # Scoping check: author can only view own ticket
    if current_user.role == "author":
        if not current_user.author_profile or ticket.author_id != current_user.author_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this ticket.",
            )

    return _format_author_ticket(ticket, ticket.author, ticket.book)


@router.post("/{ticket_id}/reply", response_model=TicketMessageOut)
def reply_to_ticket(
    ticket_id: str,
    reply: TicketMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

    if current_user.role == "author":
        if not current_user.author_profile or ticket.author_id != current_user.author_profile.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    message = TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        sender_role=current_user.role,
        content=reply.content,
        message_type="response",
        is_published=True,
    )
    db.add(message)

    # If author replies to a resolved ticket, reopen it
    if current_user.role == "author" and ticket.status in ["Resolved", "Closed"]:
        ticket.status = "In Progress"

    db.commit()
    db.refresh(message)

    return TicketMessageOut(
        id=message.id,
        ticket_id=message.ticket_id,
        sender_id=message.sender_id,
        sender_name=current_user.full_name,
        sender_role=message.sender_role,
        content=message.content,
        message_type=message.message_type,
        is_published=message.is_published,
        created_at=message.created_at,
    )


def _format_author_ticket(ticket: Ticket, author: Author, book: Optional[Book]) -> TicketOutAuthor:
    published_messages = [
        TicketMessageOut(
            id=m.id,
            ticket_id=m.ticket_id,
            sender_id=m.sender_id,
            sender_name=m.sender.full_name if m.sender else "Support",
            sender_role=m.sender_role,
            content=m.content,
            message_type=m.message_type,
            is_published=m.is_published,
            created_at=m.created_at,
        )
        for m in ticket.messages
        if m.is_published
    ]

    return TicketOutAuthor(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        author_id=author.id,
        author_name=author.name,
        book_id=book.id if book else None,
        book_title=book.title if book else "General / Account Level",
        subject=ticket.subject,
        description=ticket.description,
        attachment_filename=ticket.attachment_filename,
        category=ticket.category,
        priority=ticket.priority,
        status=ticket.status,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        messages=published_messages,
    )
