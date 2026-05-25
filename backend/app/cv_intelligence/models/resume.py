"""Resume model - CV upload and metadata storage."""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field

from app.core.enums import ResumeStatus as ResumeStatusEnum


class ResumeBase(BaseModel):
    """Base resume fields."""
    file_name: str
    file_type: str
    file_url: Optional[str] = None
    raw_text: Optional[str] = None
    parsed_summary: Optional[dict[str, Any]] = None
    is_active: bool = True


class ResumeCreate(ResumeBase):
    """Resume creation schema."""
    status: ResumeStatusEnum = ResumeStatusEnum.UPLOADED


class ResumeUpdate(BaseModel):
    """Resume update schema."""
    file_url: Optional[str] = None
    raw_text: Optional[str] = None
    parsed_summary: Optional[dict[str, Any]] = None
    status: Optional[ResumeStatusEnum] = None
    is_active: Optional[bool] = None
    error_message: Optional[str] = None


class Resume(ResumeBase):
    """Full resume model."""
    id: str
    user_id: str
    status: ResumeStatusEnum
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True