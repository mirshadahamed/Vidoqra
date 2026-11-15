from abc import ABC, abstractmethod
from typing import List, Callable, Optional, Dict, Any
from backend.app.schemas.analyze import MediaMetadata
from backend.app.schemas.format import MediaFormat

class BasePlatformAdapter(ABC):
    """
    Abstract Base Class for all Vidoqra Platform Adapters.
    Every platform integration must inherit from this class.
    """
    platform_id: str = "generic"
    platform_name: str = "Generic Platform"
    is_direct: bool = False

    @abstractmethod
    def can_handle(self, url: str) -> bool:
        """Return True if this adapter can process the given URL."""
        pass

    @abstractmethod
    async def validate_access(self, url: str) -> bool:
        """
        Verify that the URL is accessible, authorized, and compliant with security rules.
        """
        pass

    @abstractmethod
    async def get_metadata(self, url: str) -> MediaMetadata:
        """
        Extract video/audio metadata without fabricating information.
        """
        pass

    @abstractmethod
    async def get_available_formats(self, url: str) -> List[MediaFormat]:
        """
        Return genuinely available formats (video streams, audio streams, resolutions).
        """
        pass

    @abstractmethod
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
        """
        Download media stream to output_path and execute necessary FFmpeg processing safely.
        Returns final path of completed file.
        """
        pass

