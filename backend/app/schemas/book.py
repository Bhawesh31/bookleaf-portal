from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class BookOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    book_id: str
    author_id: str
    title: str
    isbn: str
    genre: str
    publication_date: Optional[date] = None
    status: str
    mrp: Optional[float] = None
    author_royalty_per_copy: Optional[float] = None
    total_copies_sold: int
    total_royalty_earned: float
    royalty_paid: float
    royalty_pending: float
    last_royalty_payout_date: Optional[date] = None
    print_partner: Optional[str] = None
    available_on: List[str]



class RoyaltySummary(BaseModel):
    total_earned: float
    total_paid: float
    total_pending: float
    threshold: float = 1000.0
    split_policy: str = "80/20 Net Profit"
    payout_window: str = "Quarterly within 45 days"
    books: List[BookOut]
