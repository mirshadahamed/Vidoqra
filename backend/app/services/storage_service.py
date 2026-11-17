import os
import time
import shutil
from typing import Optional, Tuple
from datetime import datetime, timezone, timedelta
from backend.app.core.config import settings
from backend.app.core.security import generate_secure_token
from backend.app.core.logging import logger

class StorageService:
    def __init__(self):
        self.local_dir = settings.LOCAL_STORAGE_DIR
        os.makedirs(self.local_dir, exist_ok=True)

    def get_destination_path(self, job_id: str, ext: str) -> str:
        """Generate safe, sanitized absolute path for a downloaded file."""
        safe_ext = ext.lstrip(".").lower()
        filename = f"{job_id}.{safe_ext}"
        return os.path.join(self.local_dir, filename)

    def create_download_token(self) -> str:
        return generate_secure_token(32)

    def get_file_size(self, file_path: str) -> Optional[int]:
        if os.path.exists(file_path):
            return os.path.getsize(file_path)
        return None

    def get_file_download_response(self, file_path: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """Verify file existence and return (is_valid, filename, mime_type)."""
        if not os.path.exists(file_path):
            return False, None, None

        basename = os.path.basename(file_path)
        ext = os.path.splitext(basename)[1].lstrip(".").lower()

        mimes = {
            "mp4": "video/mp4",
            "webm": "video/webm",
            "mkv": "video/x-matroska",
            "mp3": "audio/mpeg",
            "m4a": "audio/mp4",
            "wav": "audio/wav",
            "ogg": "audio/ogg",
        }
        mime = mimes.get(ext, "application/octet-stream")
        return True, basename, mime

    def delete_file(self, file_path: str) -> bool:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        except Exception as e:
            logger.error(f"Error deleting file {file_path}: {e}")
        return False

    def cleanup_expired_files(self):
        """Remove media files older than FILE_EXPIRY_HOURS."""
        now = time.time()
        expiry_seconds = settings.FILE_EXPIRY_HOURS * 3600
        try:
            for fname in os.listdir(self.local_dir):
                fpath = os.path.join(self.local_dir, fname)
                if os.path.isfile(fpath):
                    mtime = os.path.getmtime(fpath)
                    if now - mtime > expiry_seconds:
                        os.remove(fpath)
                        logger.info(f"Cleaned up expired media file: {fname}")
        except Exception as e:
            logger.error(f"Cleanup error: {e}")

storage_service = StorageService()

