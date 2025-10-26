from pydantic import BaseModel, field_validator
from typing import Optional, List, Union
from enum import Enum

class DownloadStatus(str, Enum):
    QUEUED = "queued"
    DOWNLOADING = "downloading"
    PAUSED = "paused"
    COMPLETED = "completed"
    ERROR = "error"
    CANCELLED = "cancelled"

class DownloadRequest(BaseModel):
    url: str
    format: str = "mp4"
    quality: str = "best"
    output_path: Optional[str] = None
    # Removed cookies_file and cookies_browser since Python handles those

class DownloadProgress(BaseModel):
    id: str
    url: str
    title: Optional[str] = None
    filename: Optional[str] = None
    status: DownloadStatus
    progress: float = 0.0  # 0-100
    downloaded_bytes: int = 0
    total_bytes: Optional[Union[int, float]] = None
    speed: Optional[float] = None  # bytes per second
    eta: Optional[Union[int, float]] = None  # seconds (accept both int and float)
    error_message: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None

    @field_validator('eta')
    @classmethod
    def validate_eta(cls, v):
        if v is None:
            return None
        return int(v) if isinstance(v, (int, float)) else None

    @field_validator('total_bytes')
    @classmethod
    def validate_total_bytes(cls, v):
        if v is None:
            return None
        return int(v) if isinstance(v, (int, float)) else None

class Settings(BaseModel):
    default_output_path: str
    default_format: str = "mp4"
    default_quality: str = "best"
    # Removed cookies_browser and cookies_file since Python handles those
