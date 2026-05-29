"""Roadmap model - Career/learning roadmaps."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class RoadmapBase(BaseModel):
    """Base roadmap fields."""
    target_role: str
    duration_weeks: Optional[int] = None
    overview: Optional[str] = None
    resume_id: Optional[str] = None


class RoadmapCreate(RoadmapBase):
    """Roadmap creation schema."""
    user_id: str
    progress_percent: float = 0.0


class RoadmapUpdate(BaseModel):
    """Roadmap update schema."""
    target_role: Optional[str] = None
    duration_weeks: Optional[int] = None
    overview: Optional[str] = None
    resume_id: Optional[str] = None
    progress_percent: Optional[float] = None


class Roadmap(RoadmapBase):
    """Full roadmap model."""
    id: str
    user_id: str
    progress_percent: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
