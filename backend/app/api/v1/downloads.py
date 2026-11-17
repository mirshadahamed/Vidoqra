import os
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Header, Query, status
from fastapi.responses import FileResponse
from backend.app.schemas.download import CreateDownloadRequest, DownloadJobResponse
from backend.app.services.download_service import download_service
from backend.app.services.storage_service import storage_service
from backend.app.core.security import generate_guest_session_id

router = APIRouter(tags=["Downloads"])

@router.post("/downloads", response_model=DownloadJobResponse, status_code=status.HTTP_201_CREATED)
async def create_download(
    req: CreateDownloadRequest,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
):
    session_id = x_session_id or generate_guest_session_id()
    try:
        job = await download_service.create_job(req, session_id)
        return job
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create download job: {str(e)}",
        )

@router.get("/downloads", response_model=List[DownloadJobResponse])
async def list_downloads(
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
):
    session_id = x_session_id or "guest_default"
    return await download_service.get_jobs_by_session(session_id)

@router.get("/downloads/{job_id}", response_model=DownloadJobResponse)
async def get_download_status(job_id: str):
    job = await download_service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job '{job_id}' not found.",
        )
    return job

@router.delete("/downloads/{job_id}")
async def cancel_download_job(job_id: str):
    cancelled = await download_service.cancel_job(job_id)
    if not cancelled:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job '{job_id}' not found or already finished.",
        )
    return {"message": "Job cancellation initiated successfully."}

@router.get("/downloads/{job_id}/file")
async def download_file(
    job_id: str,
    token: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
):
    job_doc = await download_service.get_job_doc(job_id)
    if not job_doc:
        # Check if the media file is directly available on disk in local storage
        for ext in ("mp4", "webm", "mkv", "mp3", "m4a", "wav"):
            candidate = storage_service.get_destination_path(job_id, ext)
            if os.path.exists(candidate):
                valid, basename, mime = storage_service.get_file_download_response(candidate)
                return FileResponse(path=candidate, media_type=mime, filename=f"media_{job_id}.{ext}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File or job not found.",
        )

    if job_doc.get("status") != "Completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File is not ready. Current job status: {job_doc.get('status')}",
        )

    # Secure download token verification
    expected_token = job_doc.get("downloadToken")
    session_matches = bool(x_session_id and x_session_id == job_doc.get("guestSessionId"))

    clean_token = token.strip() if token else None
    if clean_token in ("undefined", "null", ""):
        clean_token = None

    if expected_token and clean_token is not None:
        if clean_token != expected_token and not session_matches:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid or expired download token.",
            )

    file_path = job_doc.get("storageKey") or storage_service.get_destination_path(job_id, job_doc.get("selectedFormat", "mp4"))
    valid, basename, mime = storage_service.get_file_download_response(file_path)
    if not valid or not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media file is missing from storage or has expired.",
        )

    # Clean filename for download attachment
    title = job_doc.get("title", "media")
    clean_title = "".join(c for c in title if c.isalnum() or c in (" ", "-", "_")).strip()
    download_filename = f"{clean_title or 'media'}.{job_doc.get('selectedFormat', 'mp4')}"

    return FileResponse(
        path=file_path,
        media_type=mime,
        filename=download_filename,
    )

@router.get("/downloads/file/{job_id}")
async def download_file_alias(
    job_id: str,
    token: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
):
    """Alias for /downloads/{job_id}/file for backwards and forward compatibility."""
    return await download_file(job_id=job_id, token=token, x_session_id=x_session_id)
