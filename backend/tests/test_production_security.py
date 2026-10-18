import os
import sys

# Ensure repository root is in sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

import pytest
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import get_password_hash, verify_password
from app.models.author import Author
from app.models.book import Book
from app.models.user import User
from app.services.ai_service import DeterministicFallbackAIService, GeminiAIService
from scripts.bootstrap_demo_accounts import bootstrap_demo_accounts
from scripts.seed_database import seed_database


def test_demo_account_creation_and_repeatable_seeding():
    """Verify demo account creation and repeatable idempotent seeding."""
    # Run seed & bootstrap
    seed_database()
    bootstrap_demo_accounts()

    db = SessionLocal()
    try:
        authors = db.query(Author).all()
        books = db.query(Book).all()
        users = db.query(User).all()

        assert len(authors) == 10, f"Expected 10 authors, got {len(authors)}"
        assert len(books) == 18, f"Expected 18 books, got {len(books)}"

        # Verify all 10 authors are linked to valid login users
        for author in authors:
            assert author.user_id is not None
            user = db.query(User).filter(User.id == author.user_id).first()
            assert user is not None
            assert user.role == "author"
            assert user.is_active is True

        # Verify dedicated demo admin exists
        demo_admin = db.query(User).filter(User.email == "demo.admin@bookleaf.com").first()
        assert demo_admin is not None
        assert demo_admin.role == "admin"
        assert demo_admin.is_active is True
        assert verify_password("DemoAdmin@2026", demo_admin.password_hash)

        user_count_before = len(users)

        # Run again to ensure strict idempotency and no duplicates
        seed_database()
        bootstrap_demo_accounts()

        user_count_after = db.query(User).count()
        assert user_count_before == user_count_after, "Repeatable bootstrap created duplicate accounts!"
    finally:
        db.close()


def test_protection_against_overwriting_production_admin_password():
    """Verify that bootstrap_demo_accounts NEVER overwrites the production admin's password."""
    db = SessionLocal()
    prod_email = "admin@bookleaf.com"
    custom_secret = "CustomProductionSecret@999"

    try:
        admin_user = db.query(User).filter(User.email == prod_email).first()
        if not admin_user:
            admin_user = User(
                email=prod_email,
                password_hash=get_password_hash(custom_secret),
                full_name="Production Administrator",
                role="admin",
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
        else:
            # Explicitly set a custom password hash on production admin
            admin_user.password_hash = get_password_hash(custom_secret)
            db.commit()

        # Re-run bootstrap
        bootstrap_demo_accounts()

        # Reload admin user from DB
        admin_after = db.query(User).filter(User.email == prod_email).first()
        assert admin_after is not None
        assert verify_password(custom_secret, admin_after.password_hash), (
            "SECURITY VULNERABILITY: Production admin password was overwritten by bootstrap!"
        )
    finally:
        db.close()


def test_evaluator_demo_admin_login_and_rbac(client):
    """Verify evaluator demo admin can log in and has full administrative permissions."""
    # 1. Login with dedicated evaluator demo admin credentials
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "demo.admin@bookleaf.com", "password": "DemoAdmin@2026"},
    )
    assert login_res.status_code == 200, f"Demo admin login failed: {login_res.text}"
    admin_token = login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Access admin ticket queue
    queue_res = client.get("/api/v1/admin/tickets", headers=admin_headers)
    assert queue_res.status_code == 200

    # 3. Access admin dashboard stats
    stats_res = client.get("/api/v1/admin/dashboard-stats", headers=admin_headers)
    assert stats_res.status_code == 200
    assert "open_tickets" in stats_res.json()


def test_author_cannot_access_admin_endpoints(client):
    """Verify Role-Based Access Control: Author cannot access admin routes."""
    # Author login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "priya.sharma@email.com", "password": "AuthorDemo@2026"},
    )
    assert login_res.status_code == 200
    author_token = login_res.json()["access_token"]
    author_headers = {"Authorization": f"Bearer {author_token}"}

    # Attempt to access admin ticket queue
    queue_res = client.get("/api/v1/admin/tickets", headers=author_headers)
    assert queue_res.status_code == 403, "Author was able to access /api/v1/admin/tickets!"

    # Attempt to access admin dashboard stats
    stats_res = client.get("/api/v1/admin/dashboard-stats", headers=author_headers)
    assert stats_res.status_code == 403, "Author was able to access /api/v1/admin/dashboard-stats!"


def test_ticket_lifecycle_and_private_notes_isolation(client):
    """Verify ticket creation, status persistence, and that private notes remain invisible to author."""
    # 1. Author login & ticket creation
    author_res = client.post(
        "/api/v1/auth/login",
        json={"email": "priya.sharma@email.com", "password": "AuthorDemo@2026"},
    )
    author_token = author_res.json()["access_token"]
    author_headers = {"Authorization": f"Bearer {author_token}"}

    ticket_res = client.post(
        "/api/v1/tickets",
        json={
            "subject": "Inquiry regarding distribution on international stores",
            "description": "My book is live on Amazon India, but when will it show up on Amazon UK and US?",
        },
        headers=author_headers,
    )
    assert ticket_res.status_code == 201
    ticket = ticket_res.json()
    ticket_id = ticket["id"]
    assert ticket["status"] == "Open"
    assert ticket["category"] == "Distribution & Availability"

    # 2. Demo Admin login
    admin_res = client.post(
        "/api/v1/auth/login",
        json={"email": "demo.admin@bookleaf.com", "password": "DemoAdmin@2026"},
    )
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 3. Demo Admin assigns ticket and updates status
    assign_res = client.post(
        f"/api/v1/admin/tickets/{ticket_id}/assign-self",
        headers=admin_headers,
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["status"] == "In Progress"

    # 4. Demo Admin adds confidential private internal note
    confidential_note = "PRIVATE NOTE: IngramSpark feed synced today; propagation delay is approx 72 hours."
    note_res = client.post(
        f"/api/v1/admin/tickets/{ticket_id}/notes",
        json={"content": confidential_note},
        headers=admin_headers,
    )
    assert note_res.status_code == 200

    # 5. Demo Admin publishes public response to author
    public_reply = "Hello Priya, our international distribution feed has been submitted and typically takes 3-5 business days to index on Amazon UK/US."
    pub_res = client.post(
        f"/api/v1/admin/tickets/{ticket_id}/publish-response",
        json={"content": public_reply},
        headers=admin_headers,
    )
    assert pub_res.status_code == 200

    # 6. Author checks ticket thread
    author_view = client.get(
        f"/api/v1/tickets/{ticket_id}",
        headers=author_headers,
    )
    assert author_view.status_code == 200
    author_ticket_data = author_view.json()

    # Verify public response IS visible
    messages = author_ticket_data.get("messages", [])
    assert any(m["content"] == public_reply for m in messages), "Public reply not received by author!"

    # Verify private note is STRICTLY INVISIBLE to author
    assert "internal_notes" not in author_ticket_data
    for msg in messages:
        assert confidential_note not in msg["content"]
        assert "IngramSpark" not in msg["content"]


@pytest.mark.asyncio
async def test_ai_graceful_fallback_without_api_key():
    """Verify AI classification and response drafting fallback gracefully when API key is not configured."""
    gemini_service = GeminiAIService()

    # Classification fallback
    res = await gemini_service.classify_and_prioritize(
        subject="Missing royalty payment for 2 quarters",
        description="I have earned royalties on The Saffron Diaries but have not received any payout.",
        book_info={"title": "The Saffron Diaries", "royalty_pending": 3570.0},
    )
    assert res.category == "Royalty & Payments"
    assert res.priority in ("Critical", "High", "Medium")
    assert res.source == "fallback"

    # Response draft fallback
    draft = await gemini_service.generate_draft_response(
        author_name="Priya Sharma",
        ticket_subject="Missing royalty payment for 2 quarters",
        ticket_description="I have earned royalties on The Saffron Diaries but have not received any payout.",
        category="Royalty & Payments",
        priority="High",
        book_info={"title": "The Saffron Diaries", "royalty_pending": 3570.0, "royalty_paid": 16338.0},
    )
    assert draft.draft_reply is not None
    assert "Priya" in draft.draft_reply
    assert "80/20" in draft.draft_reply or "royalty" in draft.draft_reply.lower()
    assert draft.model_used == "deterministic-fallback-rules"
