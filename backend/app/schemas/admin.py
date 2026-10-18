from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AdminDashboardStats(BaseModel):
    total_tickets: int
    open_tickets: int
    in_progress_tickets: int
    resolved_closed_tickets: int
    critical_high_tickets: int
    unassigned_tickets: int
    avg_response_time_hours: float
    category_breakdown: Dict[str, int]
    status_breakdown: Dict[str, int]
    priority_breakdown: Dict[str, int]


class TicketStatusUpdate(BaseModel):
    status: str = Field(..., description="Must be Open, In Progress, Resolved, or Closed")


class TicketPriorityOverride(BaseModel):
    priority: str = Field(..., description="Must be Critical, High, Medium, or Low")
    reason: Optional[str] = None


class TicketCategoryOverride(BaseModel):
    category: str = Field(..., description="One of the 6 official BookLeaf categories")
    reason: Optional[str] = None


class TicketAssignUpdate(BaseModel):
    admin_id: Optional[str] = None


class AIDraftRequest(BaseModel):
    custom_instructions: Optional[str] = None


class AIDraftResponse(BaseModel):
    draft_reply: str
    grounding_facts: List[str]
    policy_references: List[str]
    confidence: float
    model_used: str


class PublishResponseRequest(BaseModel):
    content: str = Field(..., min_length=1)
