import sys
import os
import types
import asyncio
from contextlib import asynccontextmanager

# Self-resolving backend module for Vercel / serverless subfolder deployments
if "backend" not in sys.modules:
    app_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(app_dir)
    parent_dir = os.path.dirname(backend_dir)
    if parent_dir and parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    pkg = types.ModuleType("backend")
    pkg.__path__ = [backend_dir]
    sys.modules["backend"] = pkg
    app_pkg = types.ModuleType("backend.app")
    app_pkg.__path__ = [app_dir]
    sys.modules["backend.app"] = app_pkg
    pkg.app = app_pkg

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
    allow_origin_regex=settings.ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_private_network=True,
    expose_headers=["Content-Disposition", "X-Session-ID"],
)

# Include API v1 routes
app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(analyze.router, prefix=settings.API_V1_PREFIX)
app.include_router(formats.router, prefix=settings.API_V1_PREFIX)
app.include_router(downloads.router, prefix=settings.API_V1_PREFIX)
app.include_router(history.router, prefix=settings.API_V1_PREFIX)

# Root & Health convenience routes
@app.get("/", tags=["Root"])
async def root():
    return {
        "project": "Vidoqra API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health",
    }

@app.get("/health", tags=["Root"])
async def root_health():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "message": "Vidoqra API service is operational",
    }

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

