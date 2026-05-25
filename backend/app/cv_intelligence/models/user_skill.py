"""User skill model - Extracted and manually added skills."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class UserSkillBase(BaseModel):
    """Base user skill fields."""
    skill_name: str
    category: Optional[str] = None
    proficiency: Optional[str] = None
    evidence: Optional[str] = None
    source: str = "resume"


class UserSkillCreate(UserSkillBase):
    """User skill creation schema."""
    user_id: str
    resume_id: Optional[str] = None


class UserSkillUpdate(BaseModel):
    """User skill update schema."""
    category: Optional[str] = None
    proficiency: Optional[str] = None
    evidence: Optional[str] = None
    source: Optional[str] = None


class UserSkill(UserSkillBase):
    """Full user skill model."""
    id: str
    user_id: str
    resume_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True