from fastapi import APIRouter
from backend.app.core.database import db
from backend.app.core.events import event_bus

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "mongodb": db.is_connected and not db.is_fallback,
        "database_mode": "Atlas" if (db.is_connected and not db.is_fallback) else "Local Document Store",
        "redis": event_bus.redis_client is not None,
        "event_broker": "Redis PubSub" if event_bus.redis_client is not None else "In-Memory Event Bus",
    }

