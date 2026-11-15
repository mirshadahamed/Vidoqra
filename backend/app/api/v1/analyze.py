from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.analyze import AnalyzeRequest, MediaMetadata
from backend.app.services.analyzer_service import analyzer_service

router = APIRouter(tags=["Media Analysis"])

@router.post("/analyze", response_model=MediaMetadata)
async def analyze_url(req: AnalyzeRequest):
    try:
        metadata = await analyzer_service.analyze_url(req.url)
        return metadata
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}",
        )

