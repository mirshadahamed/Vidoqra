from celery import Celery
from backend.app.core.config import settings

celery_app = Celery(
    "vidoqra_worker",
    broker=settings.broker_url,
    backend=settings.result_backend,
    include=["backend.app.workers.download_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=settings.MAX_DOWNLOAD_DURATION_SECONDS,
    worker_concurrency=4,
)

