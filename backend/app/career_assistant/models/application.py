"""Application model - Kanban board application cards."""
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, model_validator

from app.core.enums import ApplicationStatus as ApplicationStatusEnum


class ApplicationBase(BaseModel):
    """Base application fields."""
    manual_job_title: Optional[str] = None
    manual_company: Optional[str] = None
    manual_location: Optional[str] = None
    notes: Optional[str] = None
    deadline: Optional[date] = None


class ApplicationCreate(ApplicationBase):
    """Manual application creation schema."""
    manual_job_title: str = Field(min_length=1, max_length=200)
    status: ApplicationStatusEnum = ApplicationStatusEnum.SAVED

    @model_validator(mode="after")
    def trim_manual_fields(self) -> "ApplicationCreate":
        self.manual_job_title = self.manual_job_title.strip()
        self.manual_company = self.manual_company.strip() if self.manual_company else None
        self.manual_location = self.manual_location.strip() if self.manual_location else None
        return self


class ApplicationUpdate(BaseModel):
    """Application update schema."""
    manual_job_title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    manual_company: Optional[str] = None
    manual_location: Optional[str] = None
    notes: Optional[str] = None
    deadline: Optional[date] = None


class ApplicationStatusUpdate(BaseModel):
    """Application status update schema."""
    status: ApplicationStatusEnum
    note: Optional[str] = None


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


class ApplicationDetail(Application):
    """Application detail model with status history."""
    history: list["ApplicationHistory"] = Field(default_factory=list)


from app.career_assistant.models.application_history import ApplicationHistory

ApplicationDetail.model_rebuild()
