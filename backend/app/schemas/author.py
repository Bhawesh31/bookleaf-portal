from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.book import BookOut


class AuthorProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    author_id: str
    name: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = None
    joined_date: Optional[date] = None


class AuthorRecentTicket(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ticket_number: str
    subject: str
    category: str
    priority: str
    status: str
    created_at: str



class AuthorDashboardStats(BaseModel):
    author: AuthorProfile
    total_books: int
    published_books: int
    in_production_books: int
    total_copies_sold: int
    total_royalty_earned: float
    royalty_paid: float
    royalty_pending: float
    recent_tickets: List[AuthorRecentTicket]
