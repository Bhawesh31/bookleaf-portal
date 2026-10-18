from typing import List, Optional, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "BookLeaf Author Support & Communication Portal"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/bookleaf_db"

    # Security & JWT
    JWT_SECRET_KEY: str = "bookleaf-super-secure-secret-key-change-in-production-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v_clean = v.strip()
            if not v_clean:
                return []
            if v_clean.startswith("[") and v_clean.endswith("]"):
                import json
                try:
                    parsed = json.loads(v_clean)
                    if isinstance(parsed, list):
                        return [str(item).strip().rstrip("/") for item in parsed if str(item).strip()]
                except Exception:
                    pass
            return [i.strip().rstrip("/") for i in v_clean.split(",") if i.strip()]
        elif isinstance(v, (list, tuple)):
            return [str(i).strip().rstrip("/") for i in v if str(i).strip()]
        return []

    @property
    def cors_origins(self) -> List[str]:
        origins: List[str] = []
        raw = self.BACKEND_CORS_ORIGINS
        if isinstance(raw, list):
            origins = [o for o in raw if o and o != "*"]
        elif isinstance(raw, str) and raw.strip() and raw.strip() != "*":
            origins = [i.strip().rstrip("/") for i in raw.split(",") if i.strip() and i.strip() != "*"]

        # Ensure local development hosts are present
        dev_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        for dev_url in dev_origins:
            if dev_url not in origins:
                origins.append(dev_url)
        return origins

    # AI Configuration
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-flash-latest"
    AI_TIMEOUT_SECONDS: int = 20

    # Secured Admin & Demo Bootstrap Credentials
    ENABLE_DEMO_BOOTSTRAP: bool = True
    ADMIN_EMAIL: str = "admin@bookleaf.com"
    ADMIN_PASSWORD: str = "AdminSecure@2026"
    DEMO_ADMIN_EMAIL: Optional[str] = None
    DEMO_ADMIN_PASSWORD: Optional[str] = None

    # Default Author Password fallback
    DEMO_AUTHOR_PASSWORD: str = "AuthorDemo@2026"

    # All 10 Author Credentials
    DEMO_AUTHOR_1_EMAIL: str = "priya.sharma@email.com"
    DEMO_AUTHOR_1_PASSWORD: str = "AuthorDemo@2026"

    DEMO_AUTHOR_2_EMAIL: str = "rohit.kapoor@email.com"
    DEMO_AUTHOR_2_PASSWORD: str = "AuthorDemo@2026"

    DEMO_AUTHOR_3_EMAIL: str = "ananya.reddy@email.com"
    DEMO_AUTHOR_3_PASSWORD: str = "AuthorDemo@2026"

    DEMO_AUTHOR_4_EMAIL: str = "vikram.joshi@email.com"
    DEMO_AUTHOR_4_PASSWORD: str = "AuthorDemo@2026"

    DEMO_AUTHOR_5_EMAIL: str = "meera.nair@email.com"
    DEMO_AUTHOR_5_PASSWORD: str = "AuthorDemo@2026"

    DEMO_AUTHOR_6_EMAIL: str = "arjun.malhotra@email.com"
    DEMO_AUTHOR_6_PASSWORD: str = "AuthorDemo@2026"

    DEMO_AUTHOR_7_EMAIL: str = "sneha.kulkarni@email.com"
    DEMO_AUTHOR_7_PASSWORD: str = "AuthorDemo@2026"

    DEMO_AUTHOR_8_EMAIL: str = "farhan.sheikh@email.com"
    DEMO_AUTHOR_8_PASSWORD: str = "AuthorDemo@2026"

    DEMO_AUTHOR_9_EMAIL: str = "kavita.deshmukh@email.com"
    DEMO_AUTHOR_9_PASSWORD: str = "AuthorDemo@2026"

    DEMO_AUTHOR_10_EMAIL: str = "diya.chatterjee@email.com"
    DEMO_AUTHOR_10_PASSWORD: str = "AuthorDemo@2026"

    # Compatibility aliases
    DEMO_AUTHOR_EMAIL: str = "priya.sharma@email.com"
    DEMO_AUTHOR2_EMAIL: Optional[str] = "sneha.kulkarni@email.com"
    DEMO_AUTHOR2_PASSWORD: Optional[str] = "AuthorDemo@2026"

    @property
    def effective_admin_email(self) -> str:
        return (self.DEMO_ADMIN_EMAIL or self.ADMIN_EMAIL).strip().lower()

    @property
    def effective_admin_password(self) -> str:
        return self.DEMO_ADMIN_PASSWORD or self.ADMIN_PASSWORD

    def get_author_password_for_email(self, email: str) -> str:
        email_clean = (email or "").strip().lower()
        for i in range(1, 11):
            author_email = getattr(self, f"DEMO_AUTHOR_{i}_EMAIL", None)
            if author_email and author_email.strip().lower() == email_clean:
                return getattr(self, f"DEMO_AUTHOR_{i}_PASSWORD", self.DEMO_AUTHOR_PASSWORD)
        return self.DEMO_AUTHOR_PASSWORD

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
