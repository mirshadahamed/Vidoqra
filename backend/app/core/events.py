import asyncio
import json
from typing import Dict, Set, Any, Optional
from fastapi import WebSocket
from backend.app.core.logging import logger
from backend.app.core.config import settings

try:
    import redis.asyncio as aioredis
    HAS_REDIS = True
except ImportError:
    HAS_REDIS = False


class EventBus:
    """
    Event Bus for real-time WebSocket communication.
    Supports in-memory fan-out and Redis Pub/Sub when Redis is configured.
    """
    def __init__(self):
        # Maps job_id -> set of active WebSockets
        self.job_subscribers: Dict[str, Set[WebSocket]] = {}
        # Maps session_id or 'global' -> set of active WebSockets
        self.global_subscribers: Set[WebSocket] = set()
        self._lock = asyncio.Lock()
        self.redis_client: Optional[Any] = None
        self._pubsub_task: Optional[asyncio.Task] = None

    async def connect_redis(self):
        if not HAS_REDIS or not settings.REDIS_URL:
            logger.info("Running EventBus with local async memory broker.")
            return

        try:
            self.redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            await self.redis_client.ping()
            logger.info("EventBus connected to Redis Pub/Sub.")
            self._pubsub_task = asyncio.create_task(self._listen_redis_events())
        except Exception as e:
            logger.warning(f"Redis unavailable for EventBus ({e}). Using in-process pub/sub.")
            self.redis_client = None

    async def _listen_redis_events(self):
        """Background listener for Redis pubsub channel"""
        try:
            pubsub = self.redis_client.pubsub()
            await pubsub.subscribe("vidoqra:job_events")
            async for message in pubsub.listen():
                if message and message.get("type") == "message":
                    data = json.loads(message["data"])
                    await self._dispatch_local(data)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Redis pubsub listener error: {e}")

    async def register(self, websocket: WebSocket, job_id: Optional[str] = None):
        async with self._lock:
            if job_id:
                if job_id not in self.job_subscribers:
                    self.job_subscribers[job_id] = set()
                self.job_subscribers[job_id].add(websocket)
            else:
                self.global_subscribers.add(websocket)
        logger.debug(f"WebSocket registered for job_id={job_id}")

    async def unregister(self, websocket: WebSocket, job_id: Optional[str] = None):
        async with self._lock:
            if job_id and job_id in self.job_subscribers:
                self.job_subscribers[job_id].discard(websocket)
                if not self.job_subscribers[job_id]:
                    del self.job_subscribers[job_id]
            self.global_subscribers.discard(websocket)
        logger.debug(f"WebSocket unregistered for job_id={job_id}")

    async def publish_job_update(self, event_data: Dict[str, Any]):
        """Publish an event to both Redis (if active) and directly to connected WebSockets."""
        payload_str = json.dumps(event_data)
        if self.redis_client:
            try:
                await self.redis_client.publish("vidoqra:job_events", payload_str)
            except Exception as e:
                logger.warning(f"Failed to publish to Redis: {e}")
        # Dispatch to local websockets immediately
        await self._dispatch_local(event_data)

    async def _dispatch_local(self, event_data: Dict[str, Any]):
        job_id = event_data.get("jobId")
        targets: Set[WebSocket] = set(self.global_subscribers)
        async with self._lock:
            if job_id and job_id in self.job_subscribers:
                targets.update(self.job_subscribers[job_id])

        disconnected = []
        for ws in targets:
            try:
                await ws.send_json(event_data)
            except Exception:
                disconnected.append(ws)

        if disconnected:
            async with self._lock:
                for ws in disconnected:
                    self.global_subscribers.discard(ws)
                    if job_id and job_id in self.job_subscribers:
                        self.job_subscribers[job_id].discard(ws)


event_bus = EventBus()

