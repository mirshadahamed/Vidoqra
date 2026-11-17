import os
import uuid
import time
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from backend.app.core.database import db
from backend.app.core.config import settings
from backend.app.core.events import event_bus
from backend.app.core.logging import logger
from backend.app.models.download_job import DownloadJobModel
from backend.app.models.download import DownloadHistoryModel
from backend.app.schemas.download import CreateDownloadRequest, DownloadJobResponse, DownloadHistoryResponse
from backend.app.services.storage_service import storage_service
from backend.app.integrations.registry import platform_registry

class DownloadService:
    def __init__(self):
        # Active cancellation tokens for running tasks
        self._cancellation_events: Dict[str, asyncio.Event] = {}

    async def create_job(self, req: CreateDownloadRequest, guest_session_id: str) -> DownloadJobResponse:
        job_id = f"job_{uuid.uuid4().hex[:12]}"
        adapter = platform_registry.get_adapter(req.sourceUrl)
        source_name = adapter.platform_name if adapter else "Media Source"

        job = DownloadJobModel(
            job_id=job_id,
            source_url=req.sourceUrl,
            source_name=source_name,
            title=req.title or "Processing Media",
            selected_format=req.selectedFormat,
            selected_quality=req.selectedQuality,
            format_id=req.formatId,
            guest_session_id=guest_session_id,
            status="Queued",
            thumbnail=req.thumbnail,
            extract_audio_only=req.extractAudioOnly,
            selected_subtitle=req.selectedSubtitle,
        )

        # Store in database
        jobs_col = db.get_collection("DownloadJobs")
        await jobs_col.insert_one(job.to_dict())

        # Create cancellation event
        self._cancellation_events[job_id] = asyncio.Event()

        # Notify via EventBus
        await event_bus.publish_job_update(job.to_dict())

        # Start execution in background (Celery or async task)
        asyncio.create_task(self._execute_download_job(job.to_dict()))

        return DownloadJobResponse(**job.to_dict())

    async def _execute_download_job(self, job_dict: Dict[str, Any]):
        job_id = job_dict["jobId"]
        source_url = job_dict["sourceUrl"]
        format_id = job_dict["formatId"]
        selected_format = job_dict["selectedFormat"]
        extract_audio = job_dict.get("extractAudioOnly", False)
        selected_sub = job_dict.get("selectedSubtitle")
        cancel_event = self._cancellation_events.get(job_id)
        is_completed = False

        # Capture the active asyncio loop from the main thread
        main_loop = asyncio.get_running_loop()

        jobs_col = db.get_collection("DownloadJobs")

        dest_path = storage_service.get_destination_path(job_id, selected_format)

        async def _update_db_progress(update_data: Dict[str, Any]):
            if is_completed:
                return
            await jobs_col.update_one({"jobId": job_id}, {"$set": update_data})
            await event_bus.publish_job_update({
                "jobId": job_id,
                **update_data,
            })

        last_progress_time = 0.0

        def _on_progress(data: Dict[str, Any]):
            nonlocal is_completed, last_progress_time
            if is_completed:
                return
            # Check for cancellation
            if cancel_event and cancel_event.is_set():
                raise asyncio.CancelledError("Download job cancelled by user.")

            status = data.get("status", "Downloading")
            progress = data.get("progress", 0.0)
            speed = data.get("speed")
            eta = data.get("eta")
            file_size = data.get("fileSize")

            update_data = {
                "status": status,
                "progress": progress,
                "speed": speed,
                "eta": eta,
            }
            if file_size:
                update_data["fileSize"] = file_size

            # Safely and thread-safely dispatch to the main asyncio loop
            now = time.time()
            if status in ("Processing", "Completed", "Failed") or (now - last_progress_time >= 0.3):
                last_progress_time = now
                if main_loop and main_loop.is_running():
                    try:
                        asyncio.run_coroutine_threadsafe(_update_db_progress(update_data), main_loop)
                    except Exception as ex:
                        logger.warning(f"Error dispatching progress update: {ex}")

        try:
            # Step 1: Status = Downloading
            await jobs_col.update_one({"jobId": job_id}, {"$set": {"status": "Downloading"}})
            await event_bus.publish_job_update({"jobId": job_id, "status": "Downloading", "progress": 5.0})

            adapter = platform_registry.get_adapter(source_url)
            if not adapter:
                raise ValueError("No suitable adapter found for source URL.")

            final_file_path = await adapter.download(
                url=source_url,
                format_id=format_id,
                output_path=dest_path,
                progress_callback=_on_progress,
                extract_audio_only=extract_audio,
                selected_format=selected_format,
                selected_subtitle=selected_sub,
            )

            # Check if cancelled before finalizing
            if cancel_event and cancel_event.is_set():
                raise asyncio.CancelledError()

            # Step 2: Validate output file
            if not os.path.exists(final_file_path):
                raise RuntimeError("Processed media file was not created.")

            is_completed = True
            actual_size = storage_service.get_file_size(final_file_path)
            download_token = storage_service.create_download_token()
            now_str = datetime.now(timezone.utc).isoformat()
            expires_str = (datetime.now(timezone.utc) + timedelta(hours=settings.FILE_EXPIRY_HOURS)).isoformat()
            download_url = f"{settings.API_V1_PREFIX}/downloads/{job_id}/file?token={download_token}"

            completion_update = {
                "status": "Completed",
                "progress": 100.0,
                "speed": None,
                "eta": None,
                "fileSize": actual_size,
                "storageKey": final_file_path,
                "downloadToken": download_token,
                "downloadUrl": download_url,
                "completedAt": now_str,
                "expiresAt": expires_str,
            }

            await jobs_col.update_one({"jobId": job_id}, {"$set": completion_update})
            await event_bus.publish_job_update({"jobId": job_id, **completion_update})

            # Step 3: Record in DownloadHistory
            hist_col = db.get_collection("DownloadHistory")
            history_item = DownloadHistoryModel(
                download_id=f"hist_{uuid.uuid4().hex[:12]}",
                job_id=job_id,
                guest_session_id=job_dict["guestSessionId"],
                title=job_dict["title"],
                source_name=job_dict["sourceName"],
                quality=job_dict["selectedQuality"],
                format_ext=selected_format,
                source_url=source_url,
                file_size=actual_size,
                download_token=download_token,
                thumbnail=job_dict.get("thumbnail"),
            )
            await hist_col.insert_one(history_item.to_dict())

        except asyncio.CancelledError:
            logger.info(f"Job {job_id} cancelled.")
            await jobs_col.update_one({"jobId": job_id}, {"$set": {"status": "Cancelled", "error": "Cancelled by user"}})
            await event_bus.publish_job_update({"jobId": job_id, "status": "Cancelled", "error": "Cancelled by user"})
            if os.path.exists(dest_path):
                os.remove(dest_path)

        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}")
            err_msg = str(e)
            await jobs_col.update_one({"jobId": job_id}, {"$set": {"status": "Failed", "error": err_msg}})
            await event_bus.publish_job_update({"jobId": job_id, "status": "Failed", "error": err_msg})
        finally:
            if job_id in self._cancellation_events:
                del self._cancellation_events[job_id]

    async def get_job_doc(self, job_id: str) -> Optional[Dict[str, Any]]:
        jobs_col = db.get_collection("DownloadJobs")
        return await jobs_col.find_one({"jobId": job_id})

    async def get_job(self, job_id: str) -> Optional[DownloadJobResponse]:
        doc = await self.get_job_doc(job_id)
        if not doc:
            return None
        return DownloadJobResponse(**doc)

    async def get_jobs_by_session(self, guest_session_id: str) -> List[DownloadJobResponse]:
        jobs_col = db.get_collection("DownloadJobs")
        cursor = jobs_col.find({"guestSessionId": guest_session_id}).sort("createdAt", -1).limit(50)
        docs = await cursor.to_list(length=50)
        return [DownloadJobResponse(**d) for d in docs]

    async def cancel_job(self, job_id: str) -> bool:
        if job_id in self._cancellation_events:
            self._cancellation_events[job_id].set()
            return True
        jobs_col = db.get_collection("DownloadJobs")
        res = await jobs_col.update_one({"jobId": job_id}, {"$set": {"status": "Cancelled"}})
        return res.modified_count > 0

    async def get_history(self, guest_session_id: str, search: Optional[str] = None) -> List[DownloadHistoryResponse]:
        hist_col = db.get_collection("DownloadHistory")
        cursor = hist_col.find({"guestSessionId": guest_session_id}).sort("completedAt", -1).limit(50)
        docs = await cursor.to_list(length=50)
        results = [DownloadHistoryResponse(**d) for d in docs]
        if search:
            s = search.lower()
            results = [r for r in results if s in r.title.lower() or s in r.sourceName.lower() or s in r.format.lower()]
        return results

    async def delete_history_item(self, download_id: str, guest_session_id: str) -> bool:
        hist_col = db.get_collection("DownloadHistory")
        res = await hist_col.delete_one({"downloadId": download_id, "guestSessionId": guest_session_id})
        return res.deleted_count > 0

download_service = DownloadService()
