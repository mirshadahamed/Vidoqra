from typing import Optional, Dict, Any
from datetime import datetime, timezone

class DownloadJobModel:
    def __init__(
        self,
        job_id: str,
        source_url: str,
        source_name: str,
        title: str,
        selected_format: str,
        selected_quality: str,
        format_id: str,
        guest_session_id: str,
        status: str = "Queued",
        thumbnail: Optional[str] = None,
        extract_audio_only: bool = False,
        selected_subtitle: Optional[str] = None,
    ):
        self.jobId = job_id
        self.sourceUrl = source_url
        self.sourceName = source_name
        self.title = title
        self.selectedFormat = selected_format
        self.selectedQuality = selected_quality
        self.formatId = format_id
        self.guestSessionId = guest_session_id
        self.status = status
        self.progress = 0.0
        self.speed: Optional[float] = None
        self.eta: Optional[float] = None
        self.fileSize: Optional[int] = None
        self.storageKey: Optional[str] = None
        self.downloadToken: Optional[str] = None
        self.thumbnail = thumbnail
        self.error: Optional[str] = None
        self.extractAudioOnly = extract_audio_only
        self.selectedSubtitle = selected_subtitle
        self.createdAt = datetime.now(timezone.utc).isoformat()
        self.completedAt: Optional[str] = None
        self.expiresAt: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "jobId": self.jobId,
            "sourceUrl": self.sourceUrl,
            "sourceName": self.sourceName,
            "title": self.title,
            "selectedFormat": self.selectedFormat,
            "selectedQuality": self.selectedQuality,
            "formatId": self.formatId,
            "guestSessionId": self.guestSessionId,
            "status": self.status,
            "progress": self.progress,
            "speed": self.speed,
            "eta": self.eta,
            "fileSize": self.fileSize,
            "storageKey": self.storageKey,
            "downloadToken": self.downloadToken,
            "thumbnail": self.thumbnail,
            "error": self.error,
            "extractAudioOnly": self.extractAudioOnly,
            "selectedSubtitle": self.selectedSubtitle,
            "createdAt": self.createdAt,
            "completedAt": self.completedAt,
            "expiresAt": self.expiresAt,
        }

