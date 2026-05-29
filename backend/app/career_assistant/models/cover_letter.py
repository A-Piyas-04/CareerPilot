"""Cover letter model - Generated cover letters."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CoverLetterBase(BaseModel):
    """Base cover letter fields."""
    title: Optional[str] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    job_description: Optional[str] = None
    tone: Optional[str] = None
    extra_notes: Optional[str] = None
    content: str


class CoverLetterCreate(CoverLetterBase):
    """Cover letter creation schema."""
    user_id: str
    resume_id: Optional[str] = None
    job_id: Optional[str] = None
    version: int = 1


class CoverLetterUpdate(BaseModel):
    """Cover letter update schema."""
    title: Optional[str] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    job_description: Optional[str] = None
    tone: Optional[str] = None
    extra_notes: Optional[str] = None
    content: Optional[str] = None
    version: Optional[int] = None


class CoverLetter(CoverLetterBase):
    """Full cover letter model."""
    id: str
    user_id: str
    resume_id: Optional[str] = None
    job_id: Optional[str] = None
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
