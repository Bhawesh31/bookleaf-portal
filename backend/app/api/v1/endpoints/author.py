from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_author
from app.models.book import Book
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.author import AuthorDashboardStats, AuthorProfile, AuthorRecentTicket
from app.schemas.book import BookOut, RoyaltySummary

router = APIRouter()


@router.get("/profile", response_model=AuthorProfile)
def get_author_profile(
    current_user: User = Depends(require_author),
):
    author = current_user.author_profile
    return AuthorProfile.model_validate(author)


@router.get("/dashboard-stats", response_model=AuthorDashboardStats)
def get_author_dashboard_stats(
    current_user: User = Depends(require_author),
    db: Session = Depends(get_db),
):
    author = current_user.author_profile
    books = db.query(Book).filter(Book.author_id == author.id).all()

    total_books = len(books)
    published_books = sum(1 for b in books if b.status == "Published & Live")
    in_production_books = total_books - published_books
    total_copies_sold = sum(b.total_copies_sold for b in books)
    total_royalty_earned = float(sum(b.total_royalty_earned for b in books))
    royalty_paid = float(sum(b.royalty_paid for b in books))
    royalty_pending = float(sum(b.royalty_pending for b in books))

    recent_tickets_records = (
        db.query(Ticket)
        .filter(Ticket.author_id == author.id)
        .order_by(desc(Ticket.created_at))
        .limit(5)
        .all()
    )

    recent_tickets = [
        AuthorRecentTicket(
            id=t.id,
            ticket_number=t.ticket_number,
            subject=t.subject,
            category=t.category,
            priority=t.priority,
            status=t.status,
            created_at=t.created_at.strftime("%Y-%m-%d %H:%M"),
        )
        for t in recent_tickets_records
    ]

    return AuthorDashboardStats(
        author=AuthorProfile.model_validate(author),
        total_books=total_books,
        published_books=published_books,
        in_production_books=in_production_books,
        total_copies_sold=total_copies_sold,
        total_royalty_earned=total_royalty_earned,
        royalty_paid=royalty_paid,
        royalty_pending=royalty_pending,
        recent_tickets=recent_tickets,
    )


@router.get("/books", response_model=List[BookOut])
def get_author_books(
    search: Optional[str] = Query(None, description="Search by title, ISBN, or genre"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    status: Optional[str] = Query(None, description="Filter by status"),
    sort_by: Optional[str] = Query("title", description="Sort by title, date, or copies"),
    current_user: User = Depends(require_author),
    db: Session = Depends(get_db),
):
    author = current_user.author_profile
    query = db.query(Book).filter(Book.author_id == author.id)

    if search:
        search_filter = f"%{search.lower()}%"
        query = query.filter(
            (Book.title.ilike(search_filter))
            | (Book.isbn.ilike(search_filter))
            | (Book.genre.ilike(search_filter))
        )

    if genre:
        query = query.filter(Book.genre.ilike(f"%{genre}%"))

    if status:
        query = query.filter(Book.status.ilike(f"%{status}%"))

    if sort_by == "copies":
        query = query.order_by(desc(Book.total_copies_sold))
    elif sort_by == "date":
        query = query.order_by(desc(Book.publication_date))
    else:
        query = query.order_by(Book.title)

    books = query.all()
    return [BookOut.model_validate(b) for b in books]


@router.get("/royalties", response_model=RoyaltySummary)
def get_author_royalties(
    current_user: User = Depends(require_author),
    db: Session = Depends(get_db),
):
    author = current_user.author_profile
    books = db.query(Book).filter(Book.author_id == author.id).order_by(Book.title).all()

    total_earned = float(sum(b.total_royalty_earned for b in books))
    total_paid = float(sum(b.royalty_paid for b in books))
    total_pending = float(sum(b.royalty_pending for b in books))

    return RoyaltySummary(
        total_earned=total_earned,
        total_paid=total_paid,
        total_pending=total_pending,
        threshold=1000.0,
        split_policy="80/20 Net Profit per Book",
        payout_window="Quarterly within 45 days after quarter end",
        books=[BookOut.model_validate(b) for b in books],
    )
