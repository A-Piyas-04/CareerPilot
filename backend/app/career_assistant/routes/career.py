"""Career generation routes — cover letters, skill gap, roadmaps."""
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.career_assistant.services import career_generation_service
from app.core.auth import get_current_user

router = APIRouter(prefix="/career", tags=["career"])


class CoverLetterGenerateRequest(BaseModel):
    job_description: str = Field(..., min_length=1, max_length=12000)
    resume_id: Optional[str] = None
    job_id: Optional[str] = None
    title: Optional[str] = None
    target_role: Optional[str] = None
    company_name: Optional[str] = None


class SkillGapAnalyzeRequest(BaseModel):
    target_role: str = Field(..., min_length=1, max_length=500)
    job_description: str = Field(default="", max_length=12000)
    resume_id: Optional[str] = None
    job_id: Optional[str] = None


class RoadmapGenerateRequest(BaseModel):
    target_role: str = Field(..., min_length=1, max_length=500)
    duration_weeks: int = Field(default=8, ge=1, le=52)
    resume_id: Optional[str] = None
    job_description: str = Field(default="", max_length=12000)


@router.post("/cover-letters/generate")
def generate_cover_letter(
    payload: CoverLetterGenerateRequest,
    user_id: str = Depends(get_current_user),
) -> dict:
    return career_generation_service.generate_and_save_cover_letter(
        user_id=user_id,
        job_description=payload.job_description,
        resume_id=payload.resume_id,
        job_id=payload.job_id,
        title=payload.title,
        target_role=payload.target_role,
        company_name=payload.company_name,
    )


@router.post("/skill-gap/analyze")
def analyze_skill_gap(
    payload: SkillGapAnalyzeRequest,
    user_id: str = Depends(get_current_user),
) -> dict:
    return career_generation_service.analyze_and_save_skill_gap(
        user_id=user_id,
        target_role=payload.target_role,
        job_description=payload.job_description,
        resume_id=payload.resume_id,
        job_id=payload.job_id,
    )


@router.post("/roadmaps/generate")
def generate_roadmap(
    payload: RoadmapGenerateRequest,
    user_id: str = Depends(get_current_user),
) -> dict:
    return career_generation_service.generate_and_save_roadmap(
        user_id=user_id,
        target_role=payload.target_role,
        duration_weeks=payload.duration_weeks,
        resume_id=payload.resume_id,
        job_description=payload.job_description,
    )
