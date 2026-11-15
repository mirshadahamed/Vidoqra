from typing import Dict, Optional
from backend.app.integrations.registry import platform_registry
from backend.app.schemas.analyze import MediaMetadata
from backend.app.utils.url_validator import validate_url_security
from backend.app.core.logging import logger

class AnalyzerService:
    def __init__(self):
        # In-memory cache for recent analyses: analysis_id -> MediaMetadata
        self._analysis_cache: Dict[str, MediaMetadata] = {}

    async def analyze_url(self, url: str) -> MediaMetadata:
        url = url.strip()

        # 1. Security & SSRF Validation
        is_safe, error_reason = validate_url_security(url)
        if not is_safe:
            raise ValueError(f"Security check failed: {error_reason}")

        # 2. Platform Identification
        adapter = platform_registry.get_adapter(url)
        if not adapter:
            raise ValueError(
                "Unsupported source. Vidoqra currently supports direct media links (MP4, WebM, M4A, etc.), "
                "Internet Archive items (archive.org), and authorized media platforms where access is permitted."
            )

        # 3. Retrieve Authentic Metadata & Formats
        metadata = await adapter.get_metadata(url)

        # Cache by analysisId
        self._analysis_cache[metadata.analysisId] = metadata
        return metadata

    def get_cached_analysis(self, analysis_id: str) -> Optional[MediaMetadata]:
        return self._analysis_cache.get(analysis_id)

analyzer_service = AnalyzerService()

