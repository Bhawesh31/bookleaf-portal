from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, asc
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.audit import TicketAuditEvent
from app.models.author import Author
from app.models.book import Book
from app.models.ticket import InternalNote, Ticket, TicketMessage
from app.models.user import User
from app.schemas.admin import (
    AdminDashboardStats,
    AIDraftRequest,
    AIDraftResponse,
    PublishResponseRequest,
    TicketAssignUpdate,
    TicketCategoryOverride,
    TicketPriorityOverride,
    TicketStatusUpdate,
)
from app.schemas.ticket import (
    AuditEventOut,
    InternalNoteCreate,
    InternalNoteOut,
    TicketMessageOut,
    TicketOutAdmin,
    VALID_CATEGORIES,
    VALID_PRIORITIES,
    VALID_STATUSES,
)
from app.services.ai_service import ai_service

router = APIRouter()


@router.get("/dashboard-stats", response_model=AdminDashboardStats)
def get_admin_dashboard_stats(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    tickets = db.query(Ticket).all()
    total_tickets = len(tickets)
    open_tickets = sum(1 for t in tickets if t.status == "Open")
    in_progress_tickets = sum(1 for t in tickets if t.status == "In Progress")
    resolved_closed_tickets = sum(1 for t in tickets if t.status in ["Resolved", "Closed"])
    critical_high_tickets = sum(1 for t in tickets if t.priority in ["Critical", "High"])
    unassigned_tickets = sum(1 for t in tickets if t.assigned_admin_id is None)

    # Average response time calculation:
    # Time delta between ticket creation and first admin response message
    response_times_hours = []
    for t in tickets:
        first_admin_msg = (
            db.query(TicketMessage)
            .filter(
                TicketMessage.ticket_id == t.id,
                TicketMessage.sender_role == "admin",
                TicketMessage.is_published.is_(True),
            )
            .order_by(TicketMessage.created_at.asc())
            .first()
        )
        if first_admin_msg and t.created_at:
            delta = (first_admin_msg.created_at - t.created_at).total_seconds() / 3600.0
            if delta >= 0:
                response_times_hours.append(delta)

    avg_response_time = (
        round(sum(response_times_hours) / len(response_times_hours), 1)
        if response_times_hours
        else 0.0
    )

    category_counts = {c: 0 for c in VALID_CATEGORIES}
    status_counts = {s: 0 for s in VALID_STATUSES}
    priority_counts = {p: 0 for p in VALID_PRIORITIES}

    for t in tickets:
        category_counts[t.category] = category_counts.get(t.category, 0) + 1
        status_counts[t.status] = status_counts.get(t.status, 0) + 1
        priority_counts[t.priority] = priority_counts.get(t.priority, 0) + 1

    return AdminDashboardStats(
        total_tickets=total_tickets,
        open_tickets=open_tickets,
        in_progress_tickets=in_progress_tickets,
        resolved_closed_tickets=resolved_closed_tickets,
        critical_high_tickets=critical_high_tickets,
        unassigned_tickets=unassigned_tickets,
        avg_response_time_hours=avg_response_time,
        category_breakdown=category_counts,
        status_breakdown=status_counts,
        priority_breakdown=priority_counts,
    )


@router.get("/tickets", response_model=List[TicketOutAdmin])
def list_admin_ticket_queue(
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    assigned_admin_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_strategy: Optional[str] = Query("urgency", description="urgency, oldest, newest"),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Ticket)

    if status_filter:
        query = query.filter(Ticket.status == status_filter)
    if category:
        query = query.filter(Ticket.category == category)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if assigned_admin_id:
        if assigned_admin_id == "unassigned":
            query = query.filter(Ticket.assigned_admin_id.is_(None))
        else:
            query = query.filter(Ticket.assigned_admin_id == assigned_admin_id)

    if search:
        search_term = f"%{search.lower()}%"
        query = query.join(Author).filter(
            (Ticket.subject.ilike(search_term))
            | (Ticket.ticket_number.ilike(search_term))
            | (Author.name.ilike(search_term))
            | (Author.email.ilike(search_term))
        )

    # Documented sorting strategy:
    # "urgency": Sort unresolved first, then Critical > High > Medium > Low, then oldest creation date
    if sort_strategy == "oldest":
        query = query.order_by(asc(Ticket.created_at))
    elif sort_strategy == "newest":
        query = query.order_by(desc(Ticket.created_at))
    else:
        # Default smart urgency sort
        query = query.order_by(
            Ticket.status.in_(["Resolved", "Closed"]),  # Unresolved (False) comes before resolved (True)
            desc(Ticket.priority == "Critical"),
            desc(Ticket.priority == "High"),
            desc(Ticket.priority == "Medium"),
            asc(Ticket.created_at),
        )

    tickets = query.all()
    return [_format_admin_ticket(t) for t in tickets]


@router.get("/tickets/{ticket_id}", response_model=TicketOutAdmin)
def get_admin_ticket_detail(
    ticket_id: str,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")
    return _format_admin_ticket(ticket)


@router.patch("/tickets/{ticket_id}/status", response_model=TicketOutAdmin)
def update_ticket_status(
    ticket_id: str,
    update: TicketStatusUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if update.status not in VALID_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status: {update.status}")

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

    old_status = ticket.status
    ticket.status = update.status

    audit = TicketAuditEvent(
        ticket_id=ticket.id,
        actor_id=current_admin.id,
        action="STATUS_CHANGED",
        old_values={"status": old_status},
        new_values={"status": update.status},
    )
    db.add(audit)
    db.commit()
    db.refresh(ticket)
    return _format_admin_ticket(ticket)


@router.patch("/tickets/{ticket_id}/priority", response_model=TicketOutAdmin)
def override_ticket_priority(
    ticket_id: str,
    update: TicketPriorityOverride,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if update.priority not in VALID_PRIORITIES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid priority: {update.priority}")

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

    old_priority = ticket.priority
    ticket.priority = update.priority
    ticket.priority_source = "manual"

    audit = TicketAuditEvent(
        ticket_id=ticket.id,
        actor_id=current_admin.id,
        action="PRIORITY_OVERRIDDEN",
        old_values={"priority": old_priority},
        new_values={"priority": update.priority, "reason": update.reason},
    )
    db.add(audit)
    db.commit()
    db.refresh(ticket)
    return _format_admin_ticket(ticket)


@router.patch("/tickets/{ticket_id}/category", response_model=TicketOutAdmin)
def override_ticket_category(
    ticket_id: str,
    update: TicketCategoryOverride,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if update.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid category: {update.category}")

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

    old_category = ticket.category
    ticket.category = update.category
    ticket.classification_source = "manual"

    audit = TicketAuditEvent(
        ticket_id=ticket.id,
        actor_id=current_admin.id,
        action="CATEGORY_OVERRIDDEN",
        old_values={"category": old_category},
        new_values={"category": update.category, "reason": update.reason},
    )
    db.add(audit)
    db.commit()
    db.refresh(ticket)
    return _format_admin_ticket(ticket)


@router.post("/tickets/{ticket_id}/assign-self", response_model=TicketOutAdmin)
def assign_ticket_to_self(
    ticket_id: str,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

    old_admin_id = ticket.assigned_admin_id
    ticket.assigned_admin_id = current_admin.id
    if ticket.status == "Open":
        ticket.status = "In Progress"

    audit = TicketAuditEvent(
        ticket_id=ticket.id,
        actor_id=current_admin.id,
        action="ASSIGNED_TO_SELF",
        old_values={"assigned_admin_id": old_admin_id},
        new_values={"assigned_admin_id": current_admin.id, "admin_name": current_admin.full_name},
    )
    db.add(audit)
    db.commit()
    db.refresh(ticket)
    return _format_admin_ticket(ticket)


@router.post("/tickets/{ticket_id}/notes", response_model=InternalNoteOut)
def add_internal_note(
    ticket_id: str,
    note_in: InternalNoteCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

    note = InternalNote(
        ticket_id=ticket.id,
        admin_id=current_admin.id,
        content=note_in.content,
    )
    db.add(note)

    audit = TicketAuditEvent(
        ticket_id=ticket.id,
        actor_id=current_admin.id,
        action="NOTE_ADDED",
        new_values={"admin_name": current_admin.full_name},
    )
    db.add(audit)
    db.commit()
    db.refresh(note)

    return InternalNoteOut(
        id=note.id,
        ticket_id=note.ticket_id,
        admin_id=note.admin_id,
        admin_name=current_admin.full_name,
        content=note.content,
        created_at=note.created_at,
    )


@router.post("/tickets/{ticket_id}/ai-draft", response_model=AIDraftResponse)
async def generate_ai_draft_response(
    ticket_id: str,
    request: AIDraftRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

    author = ticket.author
    book = ticket.book
    book_info = None
    if book:
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

    draft_result = await ai_service.generate_draft_response(
        author_name=author.name,
        ticket_subject=ticket.subject,
        ticket_description=ticket.description,
        category=ticket.category,
        priority=ticket.priority,
        book_info=book_info,
        custom_instructions=request.custom_instructions,
    )

    return AIDraftResponse(
        draft_reply=draft_result.draft_reply,
        grounding_facts=draft_result.grounding_facts,
        policy_references=draft_result.policy_references,
        confidence=draft_result.confidence,
        model_used=draft_result.model_used,
    )


@router.post("/tickets/{ticket_id}/publish-response", response_model=TicketMessageOut)
def publish_response(
    ticket_id: str,
    response_in: PublishResponseRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

    message = TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_admin.id,
        sender_role="admin",
        content=response_in.content,
        message_type="admin_response",
        is_published=True,
    )
    db.add(message)

    # Automatically set ticket status to In Progress or Resolved
    if ticket.status == "Open":
        ticket.status = "In Progress"

    audit = TicketAuditEvent(
        ticket_id=ticket.id,
        actor_id=current_admin.id,
        action="RESPONSE_PUBLISHED",
        new_values={"admin_name": current_admin.full_name},
    )
    db.add(audit)
    db.commit()
    db.refresh(message)

    return TicketMessageOut(
        id=message.id,
        ticket_id=message.ticket_id,
        sender_id=message.sender_id,
        sender_name=current_admin.full_name,
        sender_role=message.sender_role,
        content=message.content,
        message_type=message.message_type,
        is_published=message.is_published,
        created_at=message.created_at,
    )


def _format_admin_ticket(ticket: Ticket) -> TicketOutAdmin:
    messages = [
        TicketMessageOut(
            id=m.id,
            ticket_id=m.ticket_id,
            sender_id=m.sender_id,
            sender_name=m.sender.full_name if m.sender else "Author/Admin",
            sender_role=m.sender_role,
            content=m.content,
            message_type=m.message_type,
            is_published=m.is_published,
            created_at=m.created_at,
        )
        for m in ticket.messages
    ]

    internal_notes = [
        InternalNoteOut(
            id=n.id,
            ticket_id=n.ticket_id,
            admin_id=n.admin_id,
            admin_name=n.admin.full_name if n.admin else "Admin",
            content=n.content,
            created_at=n.created_at,
        )
        for n in ticket.internal_notes
    ]

    audit_events = [
        AuditEventOut(
            id=a.id,
            ticket_id=a.ticket_id,
            actor_id=a.actor_id,
            actor_name=a.actor.full_name if a.actor else "System",
            action=a.action,
            old_values=a.old_values,
            new_values=a.new_values,
            created_at=a.created_at,
        )
        for a in ticket.audit_events
    ]

    return TicketOutAdmin(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        author_id=ticket.author.id,
        author_name=ticket.author.name,
        author_email=ticket.author.email,
        book_id=ticket.book.id if ticket.book else None,
        book_title=ticket.book.title if ticket.book else "General / Account Level",
        subject=ticket.subject,
        description=ticket.description,
        attachment_filename=ticket.attachment_filename,
        category=ticket.category,
        priority=ticket.priority,
        status=ticket.status,
        assigned_admin_id=ticket.assigned_admin_id,
        assigned_admin_name=ticket.assigned_admin.full_name if ticket.assigned_admin else None,
        classification_source=ticket.classification_source,
        priority_source=ticket.priority_source,
        ai_reasoning=ticket.ai_reasoning,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        messages=messages,
        internal_notes=internal_notes,
        audit_events=audit_events,
    )
