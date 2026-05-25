"""Job match model - Fit scores and ranking between resume and job."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class JobMatchBase(BaseModel):
    """Base job match fields."""
    fit_score: float
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    explanation: Optional[str] = None


class JobMatchCreate(JobMatchBase):
    """Job match creation schema."""
    user_id: str
    job_id: str
    resume_id: Optional[str] = None
    evidence_chunks: list[str] = Field(default_factory=list)


class JobMatchUpdate(BaseModel):
    """Job match update schema."""
    fit_score: Optional[float] = None
    matched_skills: Optional[list[str]] = None
    missing_skills: Optional[list[str]] = None
    explanation: Optional[str] = None
    evidence_chunks: Optional[list[str]] = None


class JobMatch(JobMatchBase):
    """Full job match model."""
    id: str
    user_id: str
    resume_id: Optional[str] = None
    job_id: str
    evidence_chunks: list[str] = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True