import json
import os
import pytest
from app.core.database import SessionLocal
from app.models.author import Author
from app.models.book import Book
from app.models.user import User


def test_verified_dataset_counts():
    db = SessionLocal()
    try:
        authors = db.query(Author).all()
        books = db.query(Book).all()

        assert len(authors) == 10, f"Expected exactly 10 authors, found {len(authors)}"
        assert len(books) == 18, f"Expected exactly 18 books, found {len(books)}"

        # Verify books in production
        bk013 = db.query(Book).filter(Book.book_id == "BK013").first()
        assert bk013 is not None
        assert bk013.status == "In Production - Cover Design"
        assert bk013.publication_date is None
        assert bk013.mrp is None
        assert float(bk013.total_royalty_earned) == 0.0

        bk015 = db.query(Book).filter(Book.book_id == "BK015").first()
        assert bk015 is not None
        assert bk015.status == "In Production - Typesetting"
        assert bk015.publication_date is None
        assert bk015.mrp is None

        # Verify multi-platform distribution
        bk004 = db.query(Book).filter(Book.book_id == "BK004").first()
        assert bk004 is not None
        assert "Amazon UK" in bk004.available_on

        # Verify all authors have linked user accounts from bootstrap
        linked_authors = [a for a in authors if a.user_id is not None]
        assert len(linked_authors) == 10

        # Verify admin user
        admin = db.query(User).filter(User.role == "admin").first()
        assert admin is not None
        assert admin.email == "admin@bookleaf.com"

    finally:
        db.close()
