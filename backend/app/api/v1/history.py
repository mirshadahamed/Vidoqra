from typing import List, Optional
from fastapi import APIRouter, HTTPException, Header, Query, status
from backend.app.schemas.download import DownloadHistoryResponse
from backend.app.services.download_service import download_service

router = APIRouter(tags=["Download History"])

@router.get("/history", response_model=List[DownloadHistoryResponse])
async def get_history(
    search: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
):
    session_id = x_session_id or "guest_default"
    return await download_service.get_history(session_id, search)

@router.delete("/history/{download_id}")
async def delete_history_item(
    download_id: str,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
):
    session_id = x_session_id or "guest_default"
    deleted = await download_service.delete_history_item(download_id, session_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="History item not found or already deleted.",
        )
    return {"message": "History record removed successfully."}

