import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Date, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Author(Base):
    __tablename__ = "authors"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    author_id = Column(String(50), unique=True, index=True, nullable=False)  # "AUTH001"
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    city = Column(String(100), nullable=True)
    joined_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="author_profile")
    books = relationship("Book", back_populates="author", cascade="all, delete-orphan", order_by="Book.title")
    tickets = relationship("Ticket", back_populates="author", cascade="all, delete-orphan", order_by="desc(Ticket.created_at)")
