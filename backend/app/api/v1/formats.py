from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.analyze import MediaMetadata
from backend.app.services.analyzer_service import analyzer_service

router = APIRouter(tags=["Media Formats"])

@router.get("/formats/{analysis_id}", response_model=MediaMetadata)
async def get_formats_by_analysis(analysis_id: str):
    cached = analyzer_service.get_cached_analysis(analysis_id)
    if not cached:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis session '{analysis_id}' not found or expired. Please re-analyze the link.",
        )
    return cached

