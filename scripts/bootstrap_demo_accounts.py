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
    """
    Safely and idempotently bootstraps evaluator demo accounts while protecting
    the real production administrator account against accidental password resets.
    """
    if not settings.ENABLE_DEMO_BOOTSTRAP:
        print("Demo bootstrap is disabled by configuration (ENABLE_DEMO_BOOTSTRAP=False).")
        return

    db = SessionLocal()
    try:
        # 1. Bootstrap Demo Author Accounts (10 Authors)
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
                # Idempotent: Never overwrite author password if already provisioned
                if not user.is_active:
                    user.is_active = True
                if user.role != "author":
                    user.role = "author"

            # Ensure author profile is linked to user account
            if author.user_id != user.id:
                author.user_id = user.id
            authors_linked += 1

        # 2. Bootstrap Dedicated Demo Admin Account (For Evaluators)
        demo_admin_email = (settings.DEMO_ADMIN_EMAIL or "demo.admin@bookleaf.com").strip().lower()
        demo_admin_user = db.query(User).filter(User.email == demo_admin_email).first()
        demo_admin_pwd = settings.DEMO_ADMIN_PASSWORD or "DemoAdmin@2026"

        if not demo_admin_user:
            demo_admin_user = User(
                email=demo_admin_email,
                password_hash=get_password_hash(demo_admin_pwd),
                full_name="Demo Operations Administrator",
                role="admin",
                is_active=True,
            )
            db.add(demo_admin_user)
            db.flush()
            print(f"Created dedicated evaluator demo admin: {demo_admin_email}")
        else:
            demo_admin_user.role = "admin"
            demo_admin_user.is_active = True
            # Keep the designated evaluator demo password in sync
            demo_admin_user.password_hash = get_password_hash(demo_admin_pwd)
            print(f"Verified dedicated evaluator demo admin: {demo_admin_email}")

        # 3. Bootstrap Private Production Admin Account (Separate & Protected)
        prod_admin_email = settings.ADMIN_EMAIL.strip().lower()
        if prod_admin_email and prod_admin_email != demo_admin_email:
            prod_admin_user = db.query(User).filter(User.email == prod_admin_email).first()
            if not prod_admin_user:
                if settings.ADMIN_PASSWORD:
                    prod_admin_user = User(
                        email=prod_admin_email,
                        password_hash=get_password_hash(settings.ADMIN_PASSWORD),
                        full_name="Operations Administrator",
                        role="admin",
                        is_active=True,
                    )
                    db.add(prod_admin_user)
                    db.flush()
                    print(f"Initialized private production admin account: {prod_admin_email}")
                else:
                    print(f"Notice: ADMIN_PASSWORD not set in environment; skipping creation of {prod_admin_email}.")
            else:
                # NEVER OVERWRITE production administrator password!
                print(f"Production administrator account exists ({prod_admin_email}); password strictly preserved.")

        db.commit()

        # Summary
        total_authors = db.query(Author).filter(Author.user_id.isnot(None)).count()
        total_admins = db.query(User).filter(User.role == "admin").count()
        total_users = db.query(User).count()

        print(f"\nAccount Bootstrap Summary:")
        print(f"- Authors with linked accounts: {total_authors}/10")
        print(f"- Admin accounts: {total_admins} (Demo: {demo_admin_email})")
        print(f"- Total Users: {total_users}")
        print(f"- Evaluator demo access secured; production admin password protected against resets.")

    except Exception as e:
        db.rollback()
        print(f"Error bootstrapping accounts: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    bootstrap_demo_accounts()
