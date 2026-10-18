import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.main import app
from app.models.author import Author
from app.models.book import Book
from app.models.user import User

# In-memory SQLite engine for fast, isolated tests
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()

    # Seed test author 1
    author1_user = User(
        email="author1@example.com",
        password_hash=get_password_hash("AuthorPass@123"),
        full_name="Priya Author",
        role="author",
        is_active=True,
    )
    session.add(author1_user)
    session.flush()

    author1 = Author(
        author_id="AUTH_TEST_1",
        user_id=author1_user.id,
        name="Priya Author",
        email="author1@example.com",
        city="Mumbai",
    )
    session.add(author1)
    session.flush()

    # Seed author 1's book
    book1 = Book(
        book_id="BK_TEST_1",
        author_id=author1.id,
        title="Test Book One",
        isbn="978-93-5000-01-1",
        genre="Literary Fiction",
        status="Published & Live",
        mrp=399.00,
        author_royalty_per_copy=35.00,
        total_copies_sold=100,
        total_royalty_earned=3500.00,
        royalty_paid=2000.00,
        royalty_pending=1500.00,
        available_on=["Amazon India", "BookLeaf Store"],
    )
    session.add(book1)

    # Seed test author 2 (for isolation tests)
    author2_user = User(
        email="author2@example.com",
        password_hash=get_password_hash("AuthorPass@123"),
        full_name="Rohit Author",
        role="author",
        is_active=True,
    )
    session.add(author2_user)
    session.flush()

    author2 = Author(
        author_id="AUTH_TEST_2",
        user_id=author2_user.id,
        name="Rohit Author",
        email="author2@example.com",
        city="Delhi",
    )
    session.add(author2)
    session.flush()

    # Seed test admin
    admin_user = User(
        email="admin@example.com",
        password_hash=get_password_hash("AdminPass@123"),
        full_name="Operations Manager",
        role="admin",
        is_active=True,
    )
    session.add(admin_user)

    # Seed evaluator demo admin
    demo_admin = User(
        email="demo.admin@bookleaf.com",
        password_hash=get_password_hash("DemoAdmin@2026"),
        full_name="Demo Operations Administrator",
        role="admin",
        is_active=True,
    )
    session.add(demo_admin)

    # Seed Priya Sharma for demo evaluation tests
    priya_user = User(
        email="priya.sharma@email.com",
        password_hash=get_password_hash("AuthorDemo@2026"),
        full_name="Priya Sharma",
        role="author",
        is_active=True,
    )
    session.add(priya_user)
    session.flush()

    priya_author = Author(
        author_id="AUTH001",
        user_id=priya_user.id,
        name="Priya Sharma",
        email="priya.sharma@email.com",
        city="Varanasi",
    )
    session.add(priya_author)

    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
