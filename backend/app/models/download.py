from typing import Optional, Dict, Any
from datetime import datetime, timezone

class DownloadHistoryModel:
    def __init__(
        self,
        download_id: str,
        job_id: str,
        guest_session_id: str,
        title: str,
        source_name: str,
        quality: str,
        format_ext: str,
        source_url: str,
        file_size: Optional[int] = None,
        download_token: Optional[str] = None,
        thumbnail: Optional[str] = None,
    ):
        self.downloadId = download_id
        self.jobId = job_id
        self.guestSessionId = guest_session_id
        self.title = title
        self.sourceName = source_name
        self.quality = quality
        self.format = format_ext
        self.sourceUrl = source_url
        self.fileSize = file_size
        self.downloadToken = download_token
        self.thumbnail = thumbnail
        self.completedAt = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "downloadId": self.downloadId,
            "jobId": self.jobId,
            "guestSessionId": self.guestSessionId,
            "title": self.title,
            "sourceName": self.sourceName,
            "quality": self.quality,
            "format": self.format,
            "sourceUrl": self.sourceUrl,
            "fileSize": self.fileSize,
            "downloadToken": self.downloadToken,
            "thumbnail": self.thumbnail,
            "completedAt": self.completedAt,
        }

