import argparse
import os
import sys

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from sqlalchemy import create_engine, text
from app.core.database import Base
from app.models.author import Author
from app.models.book import Book
from app.models.user import User


def verify_and_setup_db(db_url: str):
    # Normalize postgres:// to postgresql://
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    # Mask credentials for safe logging
    try:
        from urllib.parse import urlparse
        parsed = urlparse(db_url)
        masked_netloc = f"{parsed.username}:****@{parsed.hostname}:{parsed.port}" if parsed.hostname else "****"
        masked_url = f"{parsed.scheme}://{masked_netloc}{parsed.path}"
    except Exception:
        masked_url = "postgresql://****:****@****/****"

    print(f"\n[1/4] Connecting to database: {masked_url} ...")
    engine = create_engine(db_url, pool_pre_ping=True)

    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();")).scalar()
        print(f"  ✓ Connection successful! Engine reported: {result[:50]}...")

    print("\n[2/4] Ensuring database schema and tables exist...")
    Base.metadata.create_all(bind=engine)
    print("  ✓ Database schema verified.")

    print("\n[3/4] Running idempotent seed data verification...")
    # Import seeding functions dynamically
    from scripts.seed_database import seed_database
    from scripts.bootstrap_demo_accounts import bootstrap_demo_accounts

    # Temporarily set environment DATABASE_URL for seed scripts
    os.environ["DATABASE_URL"] = db_url

    seed_database()
    bootstrap_demo_accounts()

    print("\n[4/4] Verifying production record counts...")
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        author_count = db.query(Author).count()
        book_count = db.query(Book).count()
        user_count = db.query(User).count()
        print(f"  ✓ Verified Authors in DB: {author_count}/10")
        print(f"  ✓ Verified Books in DB: {book_count}/18")
        print(f"  ✓ Verified Users in DB: {user_count}/11")

        if author_count == 10 and book_count == 18:
            print("\n>>> PRODUCTION DATABASE SETUP & VERIFICATION SUCCESSFUL! <<<")
            return True
        else:
            print("\n[WARN] Unexpected record count detected.")
            return False
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify and setup production PostgreSQL database.")
    parser.add_argument("--url", type=str, default=None, help="Database connection URL")
    args = parser.parse_args()

    target_url = args.url or os.environ.get("DATABASE_URL")
    if not target_url:
        print("Error: No DATABASE_URL provided via --url or environment variable.")
        sys.exit(1)

    success = verify_and_setup_db(target_url)
    sys.exit(0 if success else 1)
