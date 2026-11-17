from typing import Optional
from enum import Enum
from pydantic import BaseModel, Field

class JobStatus(str, Enum):
    QUEUED = "Queued"
    ANALYZING = "Analyzing"
    DOWNLOADING = "Downloading"
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    FAILED = "Failed"
    CANCELLED = "Cancelled"

class CreateDownloadRequest(BaseModel):
    sourceUrl: str
    formatId: str
    selectedFormat: str = Field(..., description="Target output container e.g. mp4, mp3, m4a")
    selectedQuality: str = Field(..., description="Selected quality label e.g. 1080p")
    title: Optional[str] = None
    thumbnail: Optional[str] = None
    extractAudioOnly: bool = False
    selectedSubtitle: Optional[str] = None

class DownloadJobResponse(BaseModel):
    jobId: str
    sourceUrl: str
    sourceName: str
    title: str
    thumbnail: Optional[str] = None
    selectedFormat: str
    selectedQuality: str
    formatId: str
    status: JobStatus
    progress: float = 0.0
    speed: Optional[float] = None
    eta: Optional[float] = None
    fileSize: Optional[int] = None
    downloadToken: Optional[str] = None
    downloadUrl: Optional[str] = None
    error: Optional[str] = None
    createdAt: str
    completedAt: Optional[str] = None
    expiresAt: Optional[str] = None
    extractAudioOnly: bool = False
    selectedSubtitle: Optional[str] = None

class DownloadHistoryResponse(BaseModel):
    downloadId: str
    jobId: str
    title: str
    sourceName: str
    quality: str = "Best"
    format: str
    fileSize: Optional[int] = None
    downloadToken: Optional[str] = None
    completedAt: str
    sourceUrl: str
    thumbnail: Optional[str] = None
