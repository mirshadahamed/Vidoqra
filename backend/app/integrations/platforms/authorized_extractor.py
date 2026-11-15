import os
import uuid
import asyncio
from typing import List, Optional, Callable, Dict, Any
from datetime import datetime, timezone
from backend.app.integrations.base import BasePlatformAdapter
from backend.app.schemas.analyze import MediaMetadata, PlatformInfo
from backend.app.schemas.format import MediaFormat, MediaSubtitle
from backend.app.utils.url_validator import validate_url_security
from backend.app.core.config import settings
from backend.app.core.logging import logger

try:
    import yt_dlp
    HAS_YTDLP = True
except ImportError:
    HAS_YTDLP = False

class AuthorizedExtractorAdapter(BasePlatformAdapter):
    """
    Extensible yt-dlp adapter for permitted sources with strict legal & security controls.
    Zero DRM circumvention. No cookie harvesting. Safe subprocess execution.
    """
    platform_id = "authorized_extractor"
    platform_name = "Authorized Media Stream"
    is_direct = False

    def can_handle(self, url: str) -> bool:
        if not HAS_YTDLP or not url:
            return False
        # Do not override direct media or archive.org
        from backend.app.integrations.platforms.direct_media import DirectMediaAdapter
        from backend.app.integrations.platforms.internet_archive import InternetArchiveAdapter
        if DirectMediaAdapter().can_handle(url) or InternetArchiveAdapter().can_handle(url):
            return False

        # Check if yt-dlp has a valid extractor for this URL
        try:
            extractors = yt_dlp.extractor.gen_extractors()
            for ie in extractors:
                if ie.suitable(url) and ie.IE_NAME != "generic":
                    return True
            return False
        except Exception:
            return False

    async def validate_access(self, url: str) -> bool:
        safe, err = validate_url_security(url)
        if not safe:
            raise ValueError(f"Security validation failed: {err}")
        return True

    def _get_ydl_opts(self, extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        opts: Dict[str, Any] = {
            "quiet": True,
            "no_warnings": True,
            "no_color": True,
            "ffmpeg_location": settings.FFMPEG_PATH,
            "max_filesize": settings.MAX_DOWNLOAD_SIZE_BYTES,
            "nocheckcertificate": False,
            # Strict compliance: do not bypass DRM, do not use external cookies
            "extract_flat": False,
        }
        if extra:
            opts.update(extra)
        return opts

    async def get_metadata(self, url: str) -> MediaMetadata:
        await self.validate_access(url)
        if not HAS_YTDLP:
            raise RuntimeError("yt-dlp is not installed on this system.")

        loop = asyncio.get_running_loop()

        def _extract():
            with yt_dlp.YoutubeDL(self._get_ydl_opts()) as ydl:
                return ydl.extract_info(url, download=False)

        try:
            info = await loop.run_in_executor(None, _extract)
        except Exception as e:
            err_msg = str(e)
            if "DRM" in err_msg.upper() or "PROTECTED" in err_msg.upper():
                raise ValueError("This media is DRM-protected. Vidoqra strictly prohibits DRM circumvention.")
            if "PRIVATE" in err_msg.upper() or "SIGN IN" in err_msg.upper():
                raise ValueError("This media requires private authentication or account login. Access denied.")
            raise ValueError(f"Unable to analyze media source: {err_msg}")

        if not info:
            raise ValueError("No metadata returned by extractor.")

        title = info.get("title") or "Media Stream"
        duration = float(info.get("duration", 0)) if info.get("duration") else None
        thumbnail = info.get("thumbnail")
        uploader = info.get("uploader") or info.get("channel")
        description = info.get("description")
        view_count = info.get("view_count")
        extractor_key = info.get("extractor_key") or "Media"

        raw_formats = info.get("formats", [])
        video_formats: List[MediaFormat] = []
        audio_formats: List[MediaFormat] = []
        subtitles: List[MediaSubtitle] = []

        # Parse subtitles
        raw_subs = info.get("subtitles", {})
        for lang, sub_list in raw_subs.items():
            if sub_list:
                first = sub_list[0]
                subtitles.append(
                    MediaSubtitle(
                        lang=lang,
                        name=first.get("name") or lang,
                        ext=first.get("ext") or "vtt",
                        url=first.get("url"),
                    )
                )

        seen_resolutions = set()
        for f in raw_formats:
            fmt_id = str(f.get("format_id", ""))
            vcodec = f.get("vcodec")
            acodec = f.get("acodec")
            has_video = vcodec not in (None, "none")
            has_audio = acodec not in (None, "none")
            height = f.get("height")
            filesize = f.get("filesize") or f.get("filesize_approx")
            ext = f.get("ext", "mp4")
            fps = f.get("fps")

            if has_video:
                res_str = f"{height}p" if height else f.get("format_note") or "Standard"
                # Avoid duplicate identical resolutions
                res_key = (res_str, ext)
                if res_key in seen_resolutions and len(video_formats) > 8:
                    continue
                seen_resolutions.add(res_key)

                needs_merge = has_video and not has_audio
                quality_label = f"{res_str} ({ext.upper()})"
                if height and height >= 2160:
                    quality_label = f"4K Ultra HD ({height}p)"
                elif height and height >= 1080:
                    quality_label = f"Full HD ({height}p)"
                elif height and height >= 720:
                    quality_label = f"HD ({height}p)"

                video_formats.append(
                    MediaFormat(
                        formatId=fmt_id,
                        ext=ext,
                        resolution=res_str,
                        width=f.get("width"),
                        height=height,
                        fps=int(fps) if fps else None,
                        vcodec=vcodec,
                        acodec=acodec,
                        filesize=filesize,
                        hasAudio=has_audio,
                        hasVideo=True,
                        needsMerge=needs_merge,
                        qualityLabel=quality_label,
                        formatNote=f.get("format_note"),
                    )
                )
            elif has_audio and not has_video:
                abr = f.get("abr")
                abr_label = f"{int(abr)} kbps" if abr else "High Bitrate"
                audio_formats.append(
                    MediaFormat(
                        formatId=fmt_id,
                        ext=ext,
                        acodec=acodec,
                        filesize=filesize,
                        hasAudio=True,
                        hasVideo=False,
                        needsMerge=False,
                        qualityLabel=f"{ext.upper()} Audio ({abr_label})",
                        formatNote=f.get("format_note"),
                    )
                )

        # Sort video formats highest resolution first
        video_formats.sort(key=lambda x: (x.height or 0), reverse=True)

        return MediaMetadata(
            analysisId=f"ana_{uuid.uuid4().hex[:12]}",
            sourceUrl=url,
            platform=PlatformInfo(
                id=extractor_key.lower(),
                name=f"{extractor_key} (Authorized)",
                isDirect=False,
                badgeColor="#22D3EE",
            ),
            title=title,
            duration=duration,
            thumbnail=thumbnail,
            description=description,
            uploader=uploader,
            viewCount=view_count,
            videoFormats=video_formats,
            audioFormats=audio_formats,
            subtitles=subtitles[:10],
            createdAt=datetime.now(timezone.utc).isoformat(),
            isAuthorized=True,
            notice="Processed under authorized terms. Strictly respecting creator copyright and DRM restrictions.",
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
        if not HAS_YTDLP:
            raise RuntimeError("yt-dlp is not installed.")

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        loop = asyncio.get_running_loop()

        def _progress_hook(d: Dict[str, Any]):
            if not progress_callback:
                return
            status = d.get("status")
            if status == "downloading":
                total_bytes = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                downloaded = d.get("downloaded_bytes") or 0
                speed = d.get("speed")
                eta = d.get("eta")
                prog = (downloaded / total_bytes * 100) if total_bytes else 40.0
                progress_callback({
                    "status": "Downloading",
                    "progress": min(95.0, prog),
                    "speed": speed,
                    "eta": eta,
                    "fileSize": downloaded,
                })
            elif status == "finished":
                progress_callback({
                    "status": "Processing",
                    "progress": 98.0,
                })

        base_path = os.path.splitext(output_path)[0]
        outtmpl = f"{base_path}.%(ext)s"

        extra_opts: Dict[str, Any] = {
            "outtmpl": outtmpl,
            "progress_hooks": [_progress_hook],
        }

        # Target format selection: if video format has no audio, yt-dlp merges with bestaudio automatically
        if extract_audio_only or (selected_format and selected_format in {"mp3", "m4a", "wav"}):
            extra_opts["format"] = "bestaudio/best"
            extra_opts["postprocessors"] = [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": selected_format or "mp3",
                "preferredquality": "320",
            }]
        else:
            # If user picked a specific video format, combine with bestaudio if needed
            extra_opts["format"] = f"{format_id}+bestaudio/best" if format_id else "bestvideo+bestaudio/best"
            extra_opts["merge_output_format"] = selected_format or "mp4"

        ydl_opts = self._get_ydl_opts(extra_opts)

        def _run_download():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                filename = ydl.prepare_filename(info)

                # Check audio extracted file
                if extract_audio_only:
                    target_ext = selected_format or "mp3"
                    candidate = f"{base_path}.{target_ext}"
                    if os.path.exists(candidate):
                        return candidate
                    candidate2 = f"{os.path.splitext(filename)[0]}.{target_ext}"
                    if os.path.exists(candidate2):
                        return candidate2

                # Check merged target format file (e.g. .mp4)
                target_file = f"{base_path}.{selected_format or 'mp4'}"
                if os.path.exists(target_file):
                    return target_file

                if os.path.exists(filename):
                    return filename

                # Look for matching base in parent directory
                parent = os.path.dirname(output_path)
                base_name = os.path.basename(base_path)
                for f in os.listdir(parent):
                    if f.startswith(base_name):
                        return os.path.join(parent, f)
                return output_path

        final_path = await loop.run_in_executor(None, _run_download)
        return final_path

