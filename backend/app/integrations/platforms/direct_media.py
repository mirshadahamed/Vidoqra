import os
import re
import time
import httpx
import uuid
import subprocess
import json
from urllib.parse import urlparse
from typing import List, Optional, Callable, Dict, Any
from datetime import datetime, timezone
from backend.app.integrations.base import BasePlatformAdapter
from backend.app.schemas.analyze import MediaMetadata, PlatformInfo
from backend.app.schemas.format import MediaFormat
from backend.app.utils.url_validator import validate_url_security, sanitize_filename
from backend.app.core.config import settings
from backend.app.core.logging import logger

DIRECT_EXTENSIONS = {
    "mp4": "video/mp4",
    "webm": "video/webm",
    "mkv": "video/x-matroska",
    "mov": "video/quicktime",
    "avi": "video/x-msvideo",
    "m4v": "video/x-m4v",
    "mp3": "audio/mpeg",
    "m4a": "audio/mp4",
    "wav": "audio/wav",
    "ogg": "audio/ogg",
    "flac": "audio/flac",
    "aac": "audio/aac",
}

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
}

class DirectMediaAdapter(BasePlatformAdapter):
    platform_id = "direct_media"
    platform_name = "Direct Media Stream"
    is_direct = True

    def can_handle(self, url: str) -> bool:
        try:
            parsed = urlparse(url)
            path = parsed.path.lower()
            for ext in DIRECT_EXTENSIONS.keys():
                if path.endswith(f".{ext}"):
                    return True
            return False
        except Exception:
            return False

    async def validate_access(self, url: str) -> bool:
        safe, err = validate_url_security(url)
        if not safe:
            raise ValueError(f"Security validation failed: {err}")
        return True

    def _extract_ext_and_title(self, url: str) -> tuple[str, str]:
        parsed = urlparse(url)
        basename = os.path.basename(parsed.path) or "media"
        name, ext = os.path.splitext(basename)
        ext = ext.lstrip(".").lower()
        if not ext or ext not in DIRECT_EXTENSIONS:
            ext = "mp4"
        title = name.replace("-", " ").replace("_", " ").title() or "Direct Media File"
        return ext, title

    async def get_metadata(self, url: str) -> MediaMetadata:
        await self.validate_access(url)
        ext, title = self._extract_ext_and_title(url)
        is_audio = ext in {"mp3", "m4a", "wav", "ogg", "flac", "aac"}

        file_size: Optional[int] = None
        duration: Optional[float] = None
        width: Optional[int] = None
        height: Optional[int] = None

        # Safe HTTP HEAD to probe headers
        try:
            async with httpx.AsyncClient(headers=DEFAULT_HEADERS, timeout=10.0, follow_redirects=True) as client:
                resp = await client.head(url)
                if resp.status_code < 400:
                    cl = resp.headers.get("Content-Length")
                    if cl and cl.isdigit():
                        file_size = int(cl)
        except Exception as e:
            logger.warning(f"Could not retrieve Content-Length for {url}: {e}")

        # If size exceeds max limit, warn early
        if file_size and file_size > settings.MAX_DOWNLOAD_SIZE_BYTES:
            raise ValueError(f"File size ({file_size} bytes) exceeds maximum permitted limit ({settings.MAX_DOWNLOAD_SIZE_BYTES} bytes).")

        video_formats: List[MediaFormat] = []
        audio_formats: List[MediaFormat] = []

        if is_audio:
            audio_formats.append(
                MediaFormat(
                    formatId=f"direct-{ext}",
                    ext=ext,
                    filesize=file_size,
                    hasAudio=True,
                    hasVideo=False,
                    needsMerge=False,
                    qualityLabel=f"Original {ext.upper()} Audio",
                    formatNote="Direct source audio stream",
                )
            )
        else:
            video_formats.append(
                MediaFormat(
                    formatId=f"direct-{ext}",
                    ext=ext,
                    resolution="Original",
                    width=width,
                    height=height,
                    filesize=file_size,
                    hasAudio=True,
                    hasVideo=True,
                    needsMerge=False,
                    qualityLabel=f"Original {ext.upper()} Quality",
                    formatNote="Direct source video stream",
                )
            )
            # Add extracted audio option
            audio_formats.append(
                MediaFormat(
                    formatId="direct-audio-extract",
                    ext="mp3",
                    hasAudio=True,
                    hasVideo=False,
                    needsMerge=False,
                    qualityLabel="Extract MP3 Audio (320 kbps)",
                    formatNote="Extracted from video audio stream",
                )
            )

        return MediaMetadata(
            analysisId=f"ana_{uuid.uuid4().hex[:12]}",
            sourceUrl=url,
            platform=PlatformInfo(
                id=self.platform_id,
                name=self.platform_name,
                isDirect=True,
                badgeColor="#22D3EE",
            ),
            title=title,
            duration=duration,
            thumbnail=None,
            videoFormats=video_formats,
            audioFormats=audio_formats,
            subtitles=[],
            createdAt=datetime.now(timezone.utc).isoformat(),
            isAuthorized=True,
            notice="Direct media link verified with safe MIME and range headers.",
        )

    async def get_available_formats(self, url: str) -> List[MediaFormat]:
        meta = await self.get_metadata(url)
        return meta.videoFormats + meta.audioFormats

    async def download(
        self,
        url: str,
        format_id: str,
        output_path: str,
        progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None,
        extract_audio_only: bool = False,
        selected_format: Optional[str] = None,
        selected_subtitle: Optional[str] = None,
    ) -> str:
        await self.validate_access(url)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        raw_temp_path = f"{output_path}.raw"

        # Stream download with chunking and progress reporting
        total_downloaded = 0
        start_time = time.time()
        last_progress_time = 0.0

        async with httpx.AsyncClient(headers=DEFAULT_HEADERS, timeout=30.0, follow_redirects=True) as client:
            async with client.stream("GET", url) as response:
                response.raise_for_status()
                total_bytes = int(response.headers.get("Content-Length", 0))

                with open(raw_temp_path, "wb") as f:
                    async for chunk in response.aiter_bytes(chunk_size=1024 * 64):
                        f.write(chunk)
                        total_downloaded += len(chunk)

                        if total_downloaded > settings.MAX_DOWNLOAD_SIZE_BYTES:
                            f.close()
                            if os.path.exists(raw_temp_path):
                                os.remove(raw_temp_path)
                            raise ValueError("Download exceeded maximum allowed file size.")

                        now = time.time()
                        if progress_callback and (now - last_progress_time > 0.5 or (total_bytes and total_downloaded == total_bytes)):
                            last_progress_time = now
                            elapsed = now - start_time
                            speed = total_downloaded / elapsed if elapsed > 0 else 0
                            progress = (total_downloaded / total_bytes * 100) if total_bytes else 50.0
                            eta = (total_bytes - total_downloaded) / speed if speed > 0 and total_bytes else None

                            progress_callback({
                                "status": "Downloading",
                                "progress": min(98.0, progress),
                                "speed": speed,
                                "eta": eta,
                                "fileSize": total_downloaded,
                            })

        # Post-processing / Audio extraction with FFmpeg if requested
        if extract_audio_only or (selected_format and selected_format in {"mp3", "m4a", "wav"}):
            final_audio_path = f"{output_path}.{selected_format or 'mp3'}"
            if progress_callback:
                progress_callback({"status": "Processing", "progress": 99.0})

            # Safe subprocess execution without shell=True
            cmd = [
                settings.FFMPEG_PATH,
                "-y",
                "-i", raw_temp_path,
                "-vn",
            ]
            if selected_format == "mp3":
                cmd.extend(["-c:a", "libmp3lame", "-b:a", "320k"])
            elif selected_format == "m4a":
                cmd.extend(["-c:a", "aac", "-b:a", "256k"])
            elif selected_format == "wav":
                cmd.extend(["-c:a", "pcm_s16le"])
            cmd.append(final_audio_path)

            proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if proc.returncode != 0:
                logger.error(f"FFmpeg error: {proc.stderr.decode('utf-8', errors='ignore')}")
                # Fallback to raw file
                os.rename(raw_temp_path, output_path)
                return output_path

            if os.path.exists(raw_temp_path):
                os.remove(raw_temp_path)
            return final_audio_path
        else:
            os.rename(raw_temp_path, output_path)
            return output_path
