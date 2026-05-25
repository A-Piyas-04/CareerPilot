"""Job model - Structured job posting data."""
from datetime import datetime, date
from typing import Optional, Any
from pydantic import BaseModel, Field


class JobBase(BaseModel):
    """Base job fields."""
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_type: Optional[str] = None
    deadline: Optional[date] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    raw_data: dict[str, Any] = Field(default_factory=dict)


class JobCreate(JobBase):
    """Job creation schema."""
    search_id: Optional[str] = None


class JobUpdate(BaseModel):
    """Job update schema."""
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_type: Optional[str] = None
    deadline: Optional[date] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    raw_data: Optional[dict[str, Any]] = None


class Job(JobBase):
    """Full job model."""
    id: str
    search_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True