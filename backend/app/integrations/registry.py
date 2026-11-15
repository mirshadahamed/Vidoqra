from typing import List, Optional, Type
from backend.app.integrations.base import BasePlatformAdapter
from backend.app.integrations.platforms.direct_media import DirectMediaAdapter
from backend.app.integrations.platforms.internet_archive import InternetArchiveAdapter
from backend.app.integrations.platforms.authorized_extractor import AuthorizedExtractorAdapter
from backend.app.core.logging import logger

class PlatformRegistry:
    def __init__(self):
        self._adapters: List[BasePlatformAdapter] = []
        # Register standard adapters in priority order
        self.register(DirectMediaAdapter())
        self.register(InternetArchiveAdapter())
        self.register(AuthorizedExtractorAdapter())

    def register(self, adapter: BasePlatformAdapter):
        self._adapters.append(adapter)
        logger.info(f"Registered platform adapter: {adapter.platform_name} ({adapter.platform_id})")

    def get_adapter(self, url: str) -> Optional[BasePlatformAdapter]:
        for adapter in self._adapters:
            if adapter.can_handle(url):
                return adapter
        return None

    def list_supported_platforms(self) -> List[dict]:
        return [
            {
                "id": a.platform_id,
                "name": a.platform_name,
                "isDirect": a.is_direct,
            }
            for a in self._adapters
        ]

platform_registry = PlatformRegistry()

