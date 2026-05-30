"""Job hunter routes: search, list matches, save to tracker, manual paste."""
from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth import get_current_user
from app.core.config import settings
from app.core.database import get_supabase_client
from app.job_intelligence.services import job_service
from app.job_intelligence.services.sources.jsearch import JSearchAdapter
from app.job_intelligence.services.sources.jsearch_errors import JSearchError
from app.job_intelligence.services.sources.manual_paste import ManualPasteAdapter

router = APIRouter(prefix="/jobs", tags=["jobs"])


# ─── Schemas ────────────────────────────────────────────────────────────────

class EvidenceChunkSummary(BaseModel):
    chunk_id: Optional[str] = None
    section_name: str
    snippet: str
    similarity: float = 0.0


class JobSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=200)
    location: Optional[str] = Field(default=None, max_length=200)
    source: str = Field(default="jsearch")
    resume_id: str
    limit: int = Field(default=20, ge=1, le=25)


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
    evidence_chunks: list[EvidenceChunkSummary] = Field(default_factory=list)
    skills_component: float = 0.0
    mean_similarity: float = 0.0
    tracker_application_id: Optional[str] = None


class JobSearchResponse(BaseModel):
    search_id: str
    matches: list[MatchSummary]


class SaveMatchResponse(BaseModel):
    id: str
    user_id: str
    job_id: Optional[str] = None
    job_match_id: Optional[str] = None
    status: str
    manual_job_title: Optional[str] = None
    manual_company: Optional[str] = None
    manual_location: Optional[str] = None
    deadline: Optional[str] = None
    notes: Optional[str] = None
    already_saved: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ─── Routes ─────────────────────────────────────────────────────────────────

def _resolve_source(source_name: str):
    if source_name == "jsearch":
        return JSearchAdapter(
            api_key=settings.jsearch_api_key,
            host=settings.jsearch_api_host,
            base_url=settings.jsearch_base_url,
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


def _match_summary_from_dict(data: dict[str, Any]) -> MatchSummary:
    evidence = [
        EvidenceChunkSummary(**item)
        for item in (data.get("evidence_chunks") or [])
        if isinstance(item, dict)
    ]
    return MatchSummary(
        match_id=data.get("match_id"),
        job=data.get("job") or {},
        fit_score=float(data.get("fit_score", 0)),
        matched_skills=data.get("matched_skills") or [],
        missing_skills=data.get("missing_skills") or [],
        explanation=data.get("explanation") or "",
        evidence_chunks=evidence,
        skills_component=float(data.get("skills_component") or 0),
        mean_similarity=float(data.get("mean_similarity") or 0),
        tracker_application_id=data.get("tracker_application_id"),
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
    except JSearchError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    return JobSearchResponse(
        search_id=result["search_id"],
        matches=[_match_summary_from_dict(m) for m in result["matches"]],
    )


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
    try:
        result = job_service.search_and_match(
            user_id=user_id,
            resume_id=payload.resume_id,
            query=payload.title,
            location=payload.location,
            source=_OneShot(),
            supabase=supabase,
            limit=1,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    if not result["matches"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Manual job was not persisted.",
        )
    return _match_summary_from_dict(result["matches"][0])


@router.get("/matches", response_model=list[MatchSummary])
def list_matches(
    resume_id: Optional[str] = None,
    search_id: Optional[str] = None,
    job_id: Optional[str] = None,
    min_score: float = 0.0,
    saved_only: bool = False,
    limit: int = 50,
    user_id: str = Depends(get_current_user),
) -> list[MatchSummary]:
    """Return stored matches for the user, optionally filtered."""
    supabase = get_supabase_client()
    summaries = job_service.list_matches_for_user(
        user_id=user_id,
        supabase=supabase,
        resume_id=resume_id,
        search_id=search_id,
        job_id=job_id,
        min_score=min_score,
        saved_only=saved_only,
        limit=limit,
    )
    return [_match_summary_from_dict(item) for item in summaries]


@router.get("/matches/{match_id}", response_model=MatchSummary)
def get_match(
    match_id: str,
    user_id: str = Depends(get_current_user),
) -> MatchSummary:
    supabase = get_supabase_client()
    detail = job_service.get_match_detail(
        user_id=user_id,
        match_id=match_id,
        supabase=supabase,
    )
    return _match_summary_from_dict(detail)


@router.post(
    "/matches/{match_id}/save",
    response_model=SaveMatchResponse,
)
def save_match_to_tracker(
    match_id: str,
    user_id: str = Depends(get_current_user),
) -> SaveMatchResponse:
    supabase = get_supabase_client()
    result = job_service.save_to_tracker(
        user_id=user_id,
        match_id=match_id,
        supabase=supabase,
    )
    return SaveMatchResponse(**result)
