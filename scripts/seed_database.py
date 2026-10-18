import json
import os
import sys
from datetime import datetime

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.core.database import SessionLocal
from app.models.author import Author
from app.models.book import Book


def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        return None


def seed_database():
    json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "bookleaf_sample_data.json"))
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Sample dataset not found at {json_path}")

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    db = SessionLocal()
    authors_seeded = 0
    books_seeded = 0

    try:
        authors_data = data.get("authors", [])
        for a_data in authors_data:
            author_id = a_data["author_id"]
            email = a_data["email"]

            author = db.query(Author).filter(
                (Author.author_id == author_id) | (Author.email == email)
            ).first()

            if not author:
                author = Author(
                    author_id=author_id,
                    name=a_data["name"],
                    email=email,
                    phone=a_data.get("phone"),
                    city=a_data.get("city"),
                    joined_date=parse_date(a_data.get("joined_date")),
                )
                db.add(author)
                db.flush()
                authors_seeded += 1
            else:
                author.name = a_data["name"]
                author.phone = a_data.get("phone")
                author.city = a_data.get("city")
                author.joined_date = parse_date(a_data.get("joined_date"))

            # Process books
            for b_data in a_data.get("books", []):
                book_id = b_data["book_id"]
                book = db.query(Book).filter(Book.book_id == book_id).first()

                if not book:
                    book = Book(
                        book_id=book_id,
                        author_id=author.id,
                        title=b_data["title"],
                        isbn=b_data["isbn"],
                        genre=b_data["genre"],
                        publication_date=parse_date(b_data.get("publication_date")),
                        status=b_data["status"],
                        mrp=b_data.get("mrp"),
                        author_royalty_per_copy=b_data.get("author_royalty_per_copy"),
                        total_copies_sold=b_data.get("total_copies_sold", 0),
                        total_royalty_earned=b_data.get("total_royalty_earned", 0.0),
                        royalty_paid=b_data.get("royalty_paid", 0.0),
                        royalty_pending=b_data.get("royalty_pending", 0.0),
                        last_royalty_payout_date=parse_date(b_data.get("last_royalty_payout_date")),
                        print_partner=b_data.get("print_partner"),
                        available_on=b_data.get("available_on", []),
                    )
                    db.add(book)
                    books_seeded += 1
                else:
                    book.author_id = author.id
                    book.title = b_data["title"]
                    book.isbn = b_data["isbn"]
                    book.genre = b_data["genre"]
                    book.publication_date = parse_date(b_data.get("publication_date"))
                    book.status = b_data["status"]
                    book.mrp = b_data.get("mrp")
                    book.author_royalty_per_copy = b_data.get("author_royalty_per_copy")
                    book.total_copies_sold = b_data.get("total_copies_sold", 0)
                    book.total_royalty_earned = b_data.get("total_royalty_earned", 0.0)
                    book.royalty_paid = b_data.get("royalty_paid", 0.0)
                    book.royalty_pending = b_data.get("royalty_pending", 0.0)
                    book.last_royalty_payout_date = parse_date(b_data.get("last_royalty_payout_date"))
                    book.print_partner = b_data.get("print_partner")
                    book.available_on = b_data.get("available_on", [])

        db.commit()

        # Verification
        total_authors = db.query(Author).count()
        total_books = db.query(Book).count()
        print(f"Database Seeding Complete:")
        print(f"- Authors in DB: {total_authors} (Expected: 10)")
        print(f"- Books in DB: {total_books} (Expected: 18)")
        assert total_authors == 10, f"Expected 10 authors, got {total_authors}"
        assert total_books == 18, f"Expected 18 books, got {total_books}"

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
