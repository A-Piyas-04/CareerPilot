"""Skill gap analysis model - Readiness and missing skill analysis."""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


class SkillGapAnalysisBase(BaseModel):
    """Base skill gap analysis fields."""
    target_role: Optional[str] = None
    current_skills: list[str] = Field(default_factory=list)
    required_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)


class SkillGapAnalysisCreate(SkillGapAnalysisBase):
    """Skill gap analysis creation schema."""
    user_id: str
    resume_id: Optional[str] = None
    job_id: Optional[str] = None
    recommendations: Optional[dict[str, Any]] = None


class SkillGapAnalysisUpdate(BaseModel):
    """Skill gap analysis update schema."""
    target_role: Optional[str] = None
    current_skills: Optional[list[str]] = None
    required_skills: Optional[list[str]] = None
    missing_skills: Optional[list[str]] = None
    recommendations: Optional[dict[str, Any]] = None


class SkillGapAnalysis(SkillGapAnalysisBase):
    """Full skill gap analysis model."""
    id: str
    user_id: str
    resume_id: Optional[str] = None
    job_id: Optional[str] = None
    recommendations: Optional[dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True