"""Application history model - Status change tracking."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.core.enums import ApplicationStatus as ApplicationStatusEnum


class ApplicationHistoryBase(BaseModel):
    """Base application history fields."""
    note: Optional[str] = None


class ApplicationHistoryCreate(ApplicationHistoryBase):
    """Application history creation schema."""
    application_id: str
    old_status: Optional[ApplicationStatusEnum] = None
    new_status: ApplicationStatusEnum


class ApplicationHistory(ApplicationHistoryBase):
    """Full application history model."""
    id: str
    application_id: str
    old_status: Optional[ApplicationStatusEnum] = None
    new_status: ApplicationStatusEnum
    changed_at: datetime

    class Config:
        from_attributes = True