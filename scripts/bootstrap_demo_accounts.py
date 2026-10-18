import os
import sys

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.author import Author


def bootstrap_demo_accounts():
    if not settings.ENABLE_DEMO_BOOTSTRAP:
        print("Demo bootstrap is disabled by configuration (ENABLE_DEMO_BOOTSTRAP=False).")
        return

    db = SessionLocal()
    try:
        author_password_hash = get_password_hash(settings.DEMO_AUTHOR_PASSWORD)
        admin_password_hash = get_password_hash(settings.effective_admin_password)
        admin_email = settings.effective_admin_email

        # 1. Bootstrap Author Accounts
        authors = db.query(Author).all()
        if not authors:
            print("No authors found in the database. Please run seed_database.py first.")
            return

        authors_linked = 0
        for author in authors:
            specific_password = settings.get_author_password_for_email(author.email)
            author_password_hash = get_password_hash(specific_password)

            user = db.query(User).filter(User.email == author.email).first()
            if not user:
                user = User(
                    email=author.email,
                    password_hash=author_password_hash,
                    full_name=author.name,
                    role="author",
                    is_active=True,
                )
                db.add(user)
                db.flush()
                print(f"Created demo account for author: {author.name} ({author.email})")
            else:
                user.password_hash = author_password_hash

            # Link author to user
            author.user_id = user.id
            authors_linked += 1

        # 2. Bootstrap Admin Account
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            admin_user = User(
                email=admin_email,
                password_hash=admin_password_hash,
                full_name="Operations Administrator",
                role="admin",
                is_active=True,
            )
            db.add(admin_user)
            db.flush()
            print(f"Created admin account: {admin_email}")
        else:
            admin_user.password_hash = admin_password_hash
            print(f"Admin account updated: {admin_email}")

        db.commit()

        # Summary
        total_authors = db.query(Author).filter(Author.user_id.isnot(None)).count()
        total_admins = db.query(User).filter(User.role == "admin").count()
        total_users = db.query(User).count()

        print(f"\nAccount Bootstrap Summary:")
        print(f"- Authors with linked accounts: {total_authors}/10")
        print(f"- Admin accounts: {total_admins} ({admin_email})")
        print(f"- Total Users: {total_users}")
        print(f"- Credentials securely loaded from environment (.env)")

    except Exception as e:
        db.rollback()
        print(f"Error bootstrapping demo accounts: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    bootstrap_demo_accounts()
