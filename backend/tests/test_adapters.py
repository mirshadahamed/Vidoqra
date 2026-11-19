import pytest
from backend.app.integrations.platforms.direct_media import DirectMediaAdapter
from backend.app.integrations.platforms.internet_archive import InternetArchiveAdapter
from backend.app.integrations.registry import platform_registry

def test_direct_media_adapter_can_handle():
    adapter = DirectMediaAdapter()
    assert adapter.can_handle("https://example.com/video.mp4") is True
    assert adapter.can_handle("https://example.com/movie.webm") is True
    assert adapter.can_handle("https://example.com/track.mp3") is True
    assert adapter.can_handle("https://example.com/audio.m4a") is True
    assert adapter.can_handle("https://example.com/page.html") is False
    assert adapter.can_handle("https://archive.org/details/something") is False

def test_internet_archive_adapter_can_handle():
    adapter = InternetArchiveAdapter()
    assert adapter.can_handle("https://archive.org/details/ElectraGlideInBlueTrailer") is True
    assert adapter.can_handle("https://archive.org/download/item123/file.mp4") is True
    assert adapter.can_handle("https://example.com/video.mp4") is False

def test_platform_registry_routing():
    adapter1 = platform_registry.get_adapter("https://cdn.example.com/assets/sample.mp4")
    assert adapter1 is not None
    assert adapter1.platform_id == "direct_media"

    adapter2 = platform_registry.get_adapter("https://archive.org/details/test_item")
    assert adapter2 is not None
    assert adapter2.platform_id == "internet_archive"

    # Unsupported / random website
    adapter3 = platform_registry.get_adapter("https://myrandompersonalblog12345.com/post")
    assert adapter3 is None or adapter3.platform_id == "authorized_extractor"

