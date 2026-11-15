import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import db
from backend.app.core.events import event_bus
from backend.app.core.logging import logger
from backend.app.api.v1 import health, analyze, formats, downloads, history

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing Vidoqra Backend Services...")
    await db.connect()
    await event_bus.connect_redis()
    yield
    # Shutdown
    logger.info("Shutting down Vidoqra Backend Services...")
    await db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Universal Video Downloader & Media Format Inspector API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 routes
app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(analyze.router, prefix=settings.API_V1_PREFIX)
app.include_router(formats.router, prefix=settings.API_V1_PREFIX)
app.include_router(downloads.router, prefix=settings.API_V1_PREFIX)
app.include_router(history.router, prefix=settings.API_V1_PREFIX)

# WebSocket Endpoint: General & Session updates
@app.websocket("/ws/downloads")
async def websocket_downloads(websocket: WebSocket):
    await websocket.accept()
    await event_bus.register(websocket)
    try:
        while True:
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await event_bus.unregister(websocket)
    except Exception:
        await event_bus.unregister(websocket)

# WebSocket Endpoint: Specific Job Progress Stream
@app.websocket("/ws/downloads/{job_id}")
async def websocket_job_progress(websocket: WebSocket, job_id: str):
    await websocket.accept()
    await event_bus.register(websocket, job_id=job_id)
    try:
        while True:
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await event_bus.unregister(websocket, job_id=job_id)
    except Exception:
        await event_bus.unregister(websocket, job_id=job_id)

