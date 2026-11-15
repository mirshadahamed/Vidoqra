from typing import List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.format import MediaFormat, MediaSubtitle

class PlatformInfo(BaseModel):
    id: str
    name: str
    isDirect: bool = False
    badgeColor: Optional[str] = None

class MediaMetadata(BaseModel):
    analysisId: str = Field(..., description="Unique ID for this analysis")
    sourceUrl: str
    platform: PlatformInfo
    title: str
    duration: Optional[float] = None
    thumbnail: Optional[str] = None
    description: Optional[str] = None
    uploader: Optional[str] = None
    viewCount: Optional[int] = None
    videoFormats: List[MediaFormat] = Field(default_factory=list)
    audioFormats: List[MediaFormat] = Field(default_factory=list)
    subtitles: List[MediaSubtitle] = Field(default_factory=list)
    createdAt: str
    isAuthorized: bool = True
    notice: Optional[str] = None

class AnalyzeRequest(BaseModel):
    url: str = Field(..., min_length=4, max_length=2048, description="Target media URL to analyze")

class AnalyzeResponse(BaseModel):
    success: bool
    metadata: Optional[MediaMetadata] = None
    error: Optional[str] = None

