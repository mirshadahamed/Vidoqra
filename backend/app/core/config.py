import os
import shutil
from typing import List, Optional, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _determine_storage_dir() -> str:
    env_dir = os.environ.get("LOCAL_STORAGE_DIR")
    if env_dir:
        return env_dir
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        return "/tmp/vidoqra/storage/media"
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../storage/media"))


def _determine_ffmpeg_path() -> str:
    env_path = os.environ.get("FFMPEG_PATH")
    if env_path and (os.path.exists(env_path) or shutil.which(env_path)):
        return env_path
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg
    for candidate in ["/opt/homebrew/bin/ffmpeg", "/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg"]:
        if os.path.exists(candidate):
            return candidate
    return "ffmpeg"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Project metadata
    PROJECT_NAME: str = "Vidoqra"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://vidoqra.vercel.app",
        "https://vidoqra-api.vercel.app",
    ]
    ALLOWED_ORIGIN_REGEX: Optional[str] = r"^https?:\/\/(.*\.vercel\.app|localhost(:\d+)?|127\.0\.0\.1(:\d+)?)$"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Database
    MONGODB_URI: Optional[str] = Field(default=None, description="MongoDB Atlas connection URI. If None, in-memory/file fallback is used.")
    MONGODB_DATABASE: str = "vidoqra"

    # Redis & Background Workers (None by default for serverless resilience)
    REDIS_URL: Optional[str] = Field(default=None, description="Redis URL. None if running in serverless / local fallback mode.")
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None

    # Storage
    STORAGE_TYPE: str = "local"  # "local" or "s3"
    LOCAL_STORAGE_DIR: str = Field(default_factory=_determine_storage_dir)
    LOCAL_STORAGE_URL_PREFIX: str = "/api/v1/downloads"
    MAX_DOWNLOAD_SIZE_BYTES: int = 2 * 1024 * 1024 * 1024  # 2 GB default limit
    MAX_DOWNLOAD_DURATION_SECONDS: int = 14400  # 4 hours
    FILE_EXPIRY_HOURS: int = 24

    # S3 Storage Configuration
    S3_ENDPOINT_URL: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_BUCKET_NAME: Optional[str] = None
    S3_REGION_NAME: Optional[str] = "us-east-1"

    # Security & Rate Limiting
    SECRET_KEY: str = "vidoqra-dev-super-secret-key-32-chars-long"
    ALLOWED_HOSTS: List[str] = ["*"]
    MAX_CONCURRENT_JOBS_PER_SESSION: int = 3
    RATE_LIMIT_ANALYZE_PER_MINUTE: int = 30
    RATE_LIMIT_DOWNLOADS_PER_MINUTE: int = 10

    # FFmpeg & yt-dlp
    FFMPEG_PATH: str = Field(default_factory=_determine_ffmpeg_path)

    @property
    def broker_url(self) -> str:
        return self.CELERY_BROKER_URL or self.REDIS_URL or "redis://localhost:6379/0"

    @property
    def result_backend(self) -> str:
        return self.CELERY_RESULT_BACKEND or self.REDIS_URL or "redis://localhost:6379/0"


settings = Settings()

