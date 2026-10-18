import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Book(Base):
    __tablename__ = "books"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    book_id = Column(String(50), unique=True, index=True, nullable=False)  # "BK001"
    author_id = Column(String(36), ForeignKey("authors.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    isbn = Column(String(50), nullable=False, index=True)
    genre = Column(String(100), nullable=False)
    publication_date = Column(Date, nullable=True)  # Nullable for books in production
    status = Column(String(100), nullable=False)  # e.g., "Published & Live", "In Production - Cover Design"
    mrp = Column(Numeric(10, 2), nullable=True)
    author_royalty_per_copy = Column(Numeric(10, 2), nullable=True)
    total_copies_sold = Column(Integer, default=0, nullable=False)
    total_royalty_earned = Column(Numeric(12, 2), default=0.00, nullable=False)
    royalty_paid = Column(Numeric(12, 2), default=0.00, nullable=False)
    royalty_pending = Column(Numeric(12, 2), default=0.00, nullable=False)
    last_royalty_payout_date = Column(Date, nullable=True)
    print_partner = Column(String(100), nullable=True)
    available_on = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    author = relationship("Author", back_populates="books")
    tickets = relationship("Ticket", back_populates="book")
