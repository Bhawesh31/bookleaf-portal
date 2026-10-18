import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.database import Base, engine
import app.models  # ensure models are registered

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("bookleaf-portal")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing BookLeaf Author Support Portal Backend...")
    # Ensure tables exist
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema verified.")

        if settings.ENABLE_DEMO_BOOTSTRAP:
            import os
            import sys
            root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
            if root_dir not in sys.path:
                sys.path.insert(0, root_dir)
            try:
                from scripts.seed_database import seed_database
                from scripts.bootstrap_demo_accounts import bootstrap_demo_accounts
                seed_database()
                bootstrap_demo_accounts()
                logger.info("Database initial dataset and demo accounts verified idempotently.")
            except Exception as seed_err:
                logger.warning(f"Seed/bootstrap verification notice: {seed_err}")
    except Exception as e:
        logger.error(f"Database schema initialization notice: {e}")
    yield
    logger.info("Shutting down BookLeaf Portal Backend.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Official Author Support & Communication Portal API for BookLeaf Publishing",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS setup - Safe for credentials (never wildcard)
allowed_origins = [o for o in settings.cors_origins if o != "*"]
if not allowed_origins:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    if settings.ENVIRONMENT == "production":
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An internal server error occurred. Please contact system support."},
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)},
    )


# Mount versioned API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "portal": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
    }
