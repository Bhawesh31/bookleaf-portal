import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_number = Column(String(50), unique=True, index=True, nullable=False)
    author_id = Column(String(36), ForeignKey("authors.id", ondelete="CASCADE"), nullable=False, index=True)
    book_id = Column(String(36), ForeignKey("books.id", ondelete="SET NULL"), nullable=True, index=True)
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    attachment_filename = Column(String(255), nullable=True)
    
    # Categories:
    # 1. Royalty & Payments
    # 2. ISBN & Metadata Issues
    # 3. Printing & Quality
    # 4. Distribution & Availability
    # 5. Book Status & Production Updates
    # 6. General Inquiry
    category = Column(String(100), nullable=False, index=True)
    
    # Priority: Critical | High | Medium | Low
    priority = Column(String(20), nullable=False, default="Medium", index=True)
    
    # Status: Open | In Progress | Resolved | Closed
    status = Column(String(50), nullable=False, default="Open", index=True)
    
    assigned_admin_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    classification_source = Column(String(20), default="ai", nullable=False)  # "ai" | "fallback" | "manual"
    priority_source = Column(String(20), default="ai", nullable=False)  # "ai" | "fallback" | "manual"
    ai_reasoning = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    author = relationship("Author", back_populates="tickets")
    book = relationship("Book", back_populates="tickets")
    assigned_admin = relationship("User", back_populates="assigned_tickets", foreign_keys=[assigned_admin_id])
    messages = relationship("TicketMessage", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketMessage.created_at")
    internal_notes = relationship("InternalNote", back_populates="ticket", cascade="all, delete-orphan", order_by="InternalNote.created_at")
    audit_events = relationship("TicketAuditEvent", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketAuditEvent.created_at")


class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender_role = Column(String(20), nullable=False)  # "author" | "admin"
    content = Column(Text, nullable=False)
    message_type = Column(String(50), default="response", nullable=False)  # "author_query" | "admin_response"
    is_published = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    ticket = relationship("Ticket", back_populates="messages")
    sender = relationship("User", back_populates="messages")


class InternalNote(Base):
    __tablename__ = "internal_notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    admin_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    ticket = relationship("Ticket", back_populates="internal_notes")
    admin = relationship("User", back_populates="internal_notes")
