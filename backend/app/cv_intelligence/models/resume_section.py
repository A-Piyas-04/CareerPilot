"""Resume section model - Parsed CV sections storage."""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


class ResumeSectionBase(BaseModel):
    """Base resume section fields."""
    section_name: str
    section_order: int = 0
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class ResumeSectionCreate(ResumeSectionBase):
    """Resume section creation schema."""
    resume_id: str
    user_id: str


class ResumeSectionUpdate(BaseModel):
    """Resume section update schema."""
    section_name: Optional[str] = None
    section_order: Optional[int] = None
    content: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


class ResumeSection(ResumeSectionBase):
    """Full resume section model."""
    id: str
    resume_id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True