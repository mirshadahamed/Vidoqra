import asyncio
from typing import Dict, Any
from backend.app.workers.celery_app import celery_app
from backend.app.services.download_service import download_service
from backend.app.core.logging import logger

@celery_app.task(bind=True, name="vidoqra.download_job")
def process_download_job(self, job_dict: Dict[str, Any]):
    """Celery background worker processing download jobs asynchronously."""
    logger.info(f"Celery worker processing job: {job_dict.get('jobId')}")
    loop = asyncio.get_event_loop()
    if loop.is_closed():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(download_service._execute_download_job(job_dict))

