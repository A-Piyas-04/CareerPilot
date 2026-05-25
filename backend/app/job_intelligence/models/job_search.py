"""Job search model - Search queries and filters."""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


class JobSearchBase(BaseModel):
    """Base job search fields."""
    query: str
    location: Optional[str] = None
    filters: dict[str, Any] = Field(default_factory=dict)
    source: Optional[str] = None


class JobSearchCreate(JobSearchBase):
    """Job search creation schema."""
    user_id: str


class JobSearchUpdate(BaseModel):
    """Job search update schema."""
    query: Optional[str] = None
    location: Optional[str] = None
    filters: Optional[dict[str, Any]] = None
    source: Optional[str] = None


class JobSearch(JobSearchBase):
    """Full job search model."""
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True