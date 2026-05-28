"""Job hunter routes: search, list matches, save to tracker, manual paste."""
from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth import get_current_user
from app.core.config import settings
from app.core.database import get_supabase_client
from app.job_intelligence.services import job_service
from app.job_intelligence.services._helpers import _rows
from app.job_intelligence.services.sources.jsearch import JSearchAdapter
from app.job_intelligence.services.sources.manual_paste import ManualPasteAdapter

router = APIRouter(prefix="/jobs", tags=["jobs"])


# ─── Schemas ────────────────────────────────────────────────────────────────

class JobSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=200)
    location: Optional[str] = Field(default=None, max_length=200)
    source: str = Field(default="jsearch")
    resume_id: str
    limit: int = Field(default=10, ge=1, le=25)


class ManualJobRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=20_000)
    company: Optional[str] = Field(default=None, max_length=200)
    location: Optional[str] = Field(default=None, max_length=200)
    source_url: Optional[str] = Field(default=None, max_length=500)
    resume_id: str


class MatchSummary(BaseModel):
    match_id: Optional[str]
    job: dict[str, Any]
    fit_score: float
    matched_skills: list[str]
    missing_skills: list[str]
    explanation: str


class JobSearchResponse(BaseModel):
    search_id: str
    matches: list[MatchSummary]


# ─── Routes ─────────────────────────────────────────────────────────────────

def _resolve_source(source_name: str):
    if source_name == "jsearch":
        return JSearchAdapter(
            api_key=settings.rapidapi_key,
            host=settings.rapidapi_host,
        )
    if source_name == "manual":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use POST /jobs/manual to add a manually pasted job.",
        )
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unknown job source '{source_name}'. Supported: jsearch.",
    )


@router.post("/search", response_model=JobSearchResponse)
def search_jobs(
    payload: JobSearchRequest,
    user_id: str = Depends(get_current_user),
) -> JobSearchResponse:
    source = _resolve_source(payload.source)
    supabase = get_supabase_client()
    try:
        result = job_service.search_and_match(
            user_id=user_id,
            resume_id=payload.resume_id,
            query=payload.query,
            location=payload.location,
            source=source,
            supabase=supabase,
            limit=payload.limit,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    return JobSearchResponse(**result)


@router.post("/manual", response_model=MatchSummary, status_code=status.HTTP_201_CREATED)
def add_manual_job(
    payload: ManualJobRequest,
    user_id: str = Depends(get_current_user),
) -> MatchSummary:
    """Ingest a single user-pasted job, score it, persist as a match."""
    adapter = ManualPasteAdapter()
    try:
        jobs = adapter.parse(
            title=payload.title,
            description=payload.description,
            company=payload.company,
            location=payload.location,
            source_url=payload.source_url,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    class _OneShot:
        name = "manual"

        def search(self, query: str, location: str | None = None, limit: int = 10):
            return jobs

    supabase = get_supabase_client()
    result = job_service.search_and_match(
        user_id=user_id,
        resume_id=payload.resume_id,
        query=payload.title,
        location=payload.location,
        source=_OneShot(),
        supabase=supabase,
        limit=1,
    )
    if not result["matches"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Manual job was not persisted.",
        )
    return MatchSummary(**result["matches"][0])


@router.get("/matches", response_model=list[MatchSummary])
def list_matches(
    resume_id: Optional[str] = None,
    min_score: float = 0.0,
    limit: int = 50,
    user_id: str = Depends(get_current_user),
) -> list[MatchSummary]:
    """Return all stored matches for the user, optionally filtered."""
    supabase = get_supabase_client()
    query = (
        supabase.table("job_matches")
        .select("id, job_id, fit_score, matched_skills, missing_skills, explanation, jobs(*)")
        .eq("user_id", user_id)
        .order("fit_score", desc=True)
        .limit(limit)
    )
    if resume_id:
        query = query.eq("resume_id", resume_id)

    rows = _rows(query.execute())
    summaries: list[MatchSummary] = []
    for r in rows:
        if r.get("fit_score", 0) < min_score:
            continue
        job = r.get("jobs") or {}
        summaries.append(
            MatchSummary(
                match_id=r.get("id"),
                job=job,
                fit_score=float(r.get("fit_score", 0)),
                matched_skills=r.get("matched_skills") or [],
                missing_skills=r.get("missing_skills") or [],
                explanation=r.get("explanation") or "",
            )
        )
    return summaries


@router.post(
    "/matches/{match_id}/save",
    status_code=status.HTTP_201_CREATED,
)
def save_match_to_tracker(
    match_id: str,
    user_id: str = Depends(get_current_user),
) -> dict[str, Any]:
    supabase = get_supabase_client()
    return job_service.save_to_tracker(
        user_id=user_id,
        match_id=match_id,
        supabase=supabase,
    )
