"""Application model - Kanban board application cards."""
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field

from app.core.enums import ApplicationStatus as ApplicationStatusEnum


class ApplicationBase(BaseModel):
    """Base application fields."""
    notes: Optional[str] = None
    deadline: Optional[date] = None


class ApplicationCreate(ApplicationBase):
    """Application creation schema."""
    user_id: str
    job_id: Optional[str] = None
    job_match_id: Optional[str] = None
    status: ApplicationStatusEnum = ApplicationStatusEnum.SAVED
    applied_at: Optional[datetime] = None


class ApplicationUpdate(BaseModel):
    """Application update schema."""
    job_id: Optional[str] = None
    job_match_id: Optional[str] = None
    status: Optional[ApplicationStatusEnum] = None
    notes: Optional[str] = None
    applied_at: Optional[datetime] = None
    deadline: Optional[date] = None


class Application(ApplicationBase):
    """Full application model."""
    id: str
    user_id: str
    job_id: Optional[str] = None
    job_match_id: Optional[str] = None
    status: ApplicationStatusEnum
    applied_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True