from typing import Optional
from pydantic import BaseModel, Field

class MediaFormat(BaseModel):
    formatId: str = Field(..., description="Unique format identifier")
    ext: str = Field(..., description="File extension e.g. mp4, webm, mp3")
    resolution: Optional[str] = Field(None, description="Resolution string e.g. 1080p, 720p")
    width: Optional[int] = None
    height: Optional[int] = None
    fps: Optional[int] = None
    vcodec: Optional[str] = None
    acodec: Optional[str] = None
    filesize: Optional[int] = Field(None, description="Exact file size in bytes if known")
    filesizeApprox: Optional[int] = Field(None, description="Estimated file size in bytes")
    hasAudio: bool = Field(True, description="Whether this format contains an audio stream")
    hasVideo: bool = Field(True, description="Whether this format contains a video stream")
    needsMerge: bool = Field(False, description="Whether video and audio streams require merging")
    qualityLabel: str = Field(..., description="User-friendly quality label e.g. 1080p Full HD")
    formatNote: Optional[str] = None

class MediaSubtitle(BaseModel):
    lang: str
    name: str
    ext: str
    url: Optional[str] = None

