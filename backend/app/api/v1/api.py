from fastapi import APIRouter

from app.api.v1.endpoints import admin, auth, author, health, tickets

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(author.router, prefix="/author", tags=["Author Portal"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["Support Tickets"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Portal"])
