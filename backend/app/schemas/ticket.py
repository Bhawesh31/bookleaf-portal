from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

VALID_CATEGORIES = [
    "Royalty & Payments",
    "ISBN & Metadata Issues",
    "Printing & Quality",
    "Distribution & Availability",
    "Book Status & Production Updates",
    "General Inquiry",
]

VALID_PRIORITIES = ["Critical", "High", "Medium", "Low"]
VALID_STATUSES = ["Open", "In Progress", "Resolved", "Closed"]


class TicketCreate(BaseModel):
    book_id: Optional[str] = None
    subject: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    attachment_filename: Optional[str] = None


class TicketMessageCreate(BaseModel):
    content: str = Field(..., min_length=1)


class TicketMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ticket_id: str
    sender_id: str
    sender_name: str
    sender_role: str
    content: str
    message_type: str
    is_published: bool
    created_at: datetime


class InternalNoteCreate(BaseModel):
    content: str = Field(..., min_length=1)


class InternalNoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ticket_id: str
    admin_id: str
    admin_name: str
    content: str
    created_at: datetime


class AuditEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ticket_id: str
    actor_id: str
    actor_name: str
    action: str
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    created_at: datetime


# Author-facing ticket view (STRICTLY NO internal notes)
class TicketOutAuthor(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ticket_number: str
    author_id: str
    author_name: str
    book_id: Optional[str] = None
    book_title: Optional[str] = None
    subject: str
    description: str
    attachment_filename: Optional[str] = None
    category: str
    priority: str
    status: str
    created_at: datetime
    updated_at: datetime
    messages: List[TicketMessageOut] = []


# Admin-facing ticket view (Includes internal notes and audit events)
class TicketOutAdmin(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ticket_number: str
    author_id: str
    author_name: str
    author_email: str
    book_id: Optional[str] = None
    book_title: Optional[str] = None
    subject: str
    description: str
    attachment_filename: Optional[str] = None
    category: str
    priority: str
    status: str
    assigned_admin_id: Optional[str] = None
    assigned_admin_name: Optional[str] = None
    classification_source: str
    priority_source: str
    ai_reasoning: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: List[TicketMessageOut] = []
    internal_notes: List[InternalNoteOut] = []
    audit_events: List[AuditEventOut] = []

