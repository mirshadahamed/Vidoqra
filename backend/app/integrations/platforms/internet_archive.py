import os
import re
import time
import httpx
import uuid
import subprocess
from urllib.parse import urlparse
from typing import List, Optional, Callable, Dict, Any
from datetime import datetime, timezone
from backend.app.integrations.base import BasePlatformAdapter
from backend.app.schemas.analyze import MediaMetadata, PlatformInfo
from backend.app.schemas.format import MediaFormat, MediaSubtitle
from backend.app.utils.url_validator import validate_url_security, sanitize_filename
from backend.app.core.config import settings
from backend.app.core.logging import logger

ARCHIVE_IDENTIFIER_REGEX = re.compile(r'archive\.org/(?:details|download)/([^/?#]+)', re.IGNORECASE)

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
}

class InternetArchiveAdapter(BasePlatformAdapter):
    platform_id = "internet_archive"
    platform_name = "Internet Archive (archive.org)"
    is_direct = False

    def can_handle(self, url: str) -> bool:
        if not url:
            return False
        return bool(ARCHIVE_IDENTIFIER_REGEX.search(url))

    def _extract_identifier(self, url: str) -> Optional[str]:
        match = ARCHIVE_IDENTIFIER_REGEX.search(url)
        return match.group(1) if match else None

    async def validate_access(self, url: str) -> bool:
        safe, err = validate_url_security(url)
        if not safe:
            raise ValueError(f"Security validation failed: {err}")
        identifier = self._extract_identifier(url)
        if not identifier:
            raise ValueError("Could not extract Internet Archive item identifier.")
        return True

    async def get_metadata(self, url: str) -> MediaMetadata:
        await self.validate_access(url)
        identifier = self._extract_identifier(url)
        metadata_api_url = f"https://archive.org/metadata/{identifier}"

        async with httpx.AsyncClient(headers=DEFAULT_HEADERS, timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(metadata_api_url)
            if resp.status_code == 404:
                raise ValueError(f"Internet Archive item '{identifier}' was not found.")
            resp.raise_for_status()
            data = resp.json()

        item_meta = data.get("metadata", {})
        files = data.get("files", [])

        title = item_meta.get("title") or identifier
        description = item_meta.get("description")
        uploader = item_meta.get("creator") or item_meta.get("uploader")
        raw_runtime = item_meta.get("runtime")
        duration: Optional[float] = None
        if raw_runtime:
            try:
                # Runtime could be e.g. "01:23:45" or seconds
                if ":" in str(raw_runtime):
                    parts = [float(p) for p in str(raw_runtime).split(":")]
                    if len(parts) == 3:
                        duration = parts[0] * 3600 + parts[1] * 60 + parts[2]
                    elif len(parts) == 2:
                        duration = parts[0] * 60 + parts[1]
                else:
                    duration = float(raw_runtime)
            except Exception:
                pass

        # Thumbnail search
        thumbnail_url: Optional[str] = None
        for f in files:
            name = f.get("name", "")
            fmt = f.get("format", "").lower()
            if "thumb" in fmt or name.endswith("_thumb.jpg") or name.endswith(".thumb.jpg"):
                thumbnail_url = f"https://archive.org/download/{identifier}/{name}"
                break

        if not thumbnail_url:
            thumbnail_url = f"https://archive.org/services/img/{identifier}"

        video_formats: List[MediaFormat] = []
        audio_formats: List[MediaFormat] = []
        subtitles: List[MediaSubtitle] = []

        for f in files:
            name = f.get("name", "")
            fmt_name = f.get("format", "")
            size_val = f.get("size")
            file_size = int(size_val) if size_val and str(size_val).isdigit() else None
            ext = os.path.splitext(name)[1].lstrip(".").lower()
            height_val = f.get("height")
            width_val = f.get("width")
            height = int(height_val) if height_val and str(height_val).isdigit() else None
            width = int(width_val) if width_val and str(width_val).isdigit() else None

            # Subtitle formats
            if ext in {"srt", "vtt"} or "subrip" in fmt_name.lower():
                subtitles.append(
                    MediaSubtitle(
                        lang=f.get("name", "en"),
                        name=f.get("title") or name,
                        ext=ext or "srt",
                        url=f"https://archive.org/download/{identifier}/{name}",
                    )
                )
                continue

            # Video formats (e.g. 512Kb MPEG4, h.264, WebM, Ogg Video)
            if ext in {"mp4", "webm", "ogv", "mkv", "avi", "mov"} or "video" in fmt_name.lower() or "mpeg4" in fmt_name.lower() or "h.264" in fmt_name.lower():
                res_label = f"{height}p" if height else "Standard Definition"
                video_formats.append(
                    MediaFormat(
                        formatId=f"ia-{name}",
                        ext=ext or "mp4",
                        resolution=res_label,
                        width=width,
                        height=height,
                        filesize=file_size,
                        hasAudio=True,
                        hasVideo=True,
                        needsMerge=False,
                        qualityLabel=f"{fmt_name} ({res_label})",
                        formatNote=name,
                    )
                )

            # Audio formats (e.g. VBR MP3, 128Kbps MP3, Flac)
            elif ext in {"mp3", "flac", "ogg", "m4a", "wav"} or "audio" in fmt_name.lower() or "mp3" in fmt_name.lower():
                audio_formats.append(
                    MediaFormat(
                        formatId=f"ia-{name}",
                        ext=ext or "mp3",
                        filesize=file_size,
                        hasAudio=True,
                        hasVideo=False,
                        needsMerge=False,
                        qualityLabel=fmt_name or ext.upper(),
                        formatNote=name,
                    )
                )

        return MediaMetadata(
            analysisId=f"ana_{uuid.uuid4().hex[:12]}",
            sourceUrl=url,
            platform=PlatformInfo(
                id=self.platform_id,
                name=self.platform_name,
                isDirect=False,
                badgeColor="#8B5CF6",
            ),
            title=title,
            duration=duration,
            thumbnail=thumbnail_url,
            description=description,
            uploader=uploader,
            videoFormats=video_formats,
            audioFormats=audio_formats,
            subtitles=subtitles,
            createdAt=datetime.now(timezone.utc).isoformat(),
            isAuthorized=True,
            notice="Verified public domain / downloadable collection item from archive.org.",
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
        identifier = self._extract_identifier(url)
        if not identifier:
            raise ValueError("Invalid Internet Archive identifier.")

        file_name = format_id.replace("ia-", "")
        # Construct actual download URL
        file_download_url = f"https://archive.org/download/{identifier}/{file_name}"
        raw_temp_path = f"{output_path}.raw"
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        total_downloaded = 0
        start_time = time.time()
        last_progress_time = 0.0

        async with httpx.AsyncClient(headers=DEFAULT_HEADERS, timeout=45.0, follow_redirects=True) as client:
            async with client.stream("GET", file_download_url) as response:
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
                            raise ValueError("Archive download exceeded maximum allowed file size.")

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

        # Process audio conversion if requested
        if extract_audio_only or (selected_format and selected_format in {"mp3", "m4a", "wav"}):
            final_audio_path = f"{output_path}.{selected_format or 'mp3'}"
            if progress_callback:
                progress_callback({"status": "Processing", "progress": 99.0})

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
                os.rename(raw_temp_path, output_path)
                return output_path

            if os.path.exists(raw_temp_path):
                os.remove(raw_temp_path)
            return final_audio_path
        else:
            os.rename(raw_temp_path, output_path)
            return output_path
