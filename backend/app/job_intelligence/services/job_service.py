"""Job hunter orchestration: search → score → persist + save-to-tracker."""
from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status

from app.job_intelligence.services._helpers import _row, _rows
from app.job_intelligence.services.job_scorer import score_job
from app.job_intelligence.services.sources.base import JobSource


def _list_user_skill_names(*, user_id: str, supabase: Any) -> list[str]:
    response = (
        supabase.table("user_skills")
        .select("skill_name")
        .eq("user_id", user_id)
        .execute()
    )
    return [r["skill_name"] for r in _rows(response) if r.get("skill_name")]


def _persist_search(
    *, user_id: str, query: str, location: str | None, source_name: str, supabase: Any
) -> str:
    payload = {
        "user_id": user_id,
        "query": query,
        "location": location,
        "source": source_name,
        "filters": {},
    }
    response = supabase.table("job_searches").insert(payload).execute()
    row = _row(response)
    if not row or "id" not in row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to persist job_search row.",
        )
    return row["id"]


def _persist_jobs(
    *, jobs_payload: list[dict[str, Any]], supabase: Any
) -> list[dict[str, Any]]:
    if not jobs_payload:
        return []
    # Plain insert — `jobs` has no unique constraint on (source, source_url).
    # Re-running the same search may insert duplicate rows. See plan note.
    response = (
        supabase.table("jobs")
        .insert(jobs_payload)
        .execute()
    )
    return _rows(response)


def _persist_matches(
    *, matches_payload: list[dict[str, Any]], supabase: Any
) -> list[dict[str, Any]]:
    if not matches_payload:
        return []
    response = (
        supabase.table("job_matches")
        .upsert(matches_payload, on_conflict="user_id,job_id,resume_id")
        .execute()
    )
    return _rows(response)


def search_and_match(
    *,
    user_id: str,
    resume_id: str,
    query: str,
    location: str | None,
    source: JobSource,
    supabase: Any,
    limit: int = 10,
) -> dict[str, Any]:
    """Run a search against `source`, score each result, persist everything."""
    search_id = _persist_search(
        user_id=user_id,
        query=query,
        location=location,
        source_name=source.name,
        supabase=supabase,
    )

    raw_jobs = source.search(query=query, location=location, limit=limit)
    if not raw_jobs:
        return {"search_id": search_id, "matches": []}

    jobs_payload = [
        {**job.model_dump(mode="json", exclude_none=True), "search_id": search_id}
        for job in raw_jobs
    ]
    persisted_jobs = _persist_jobs(jobs_payload=jobs_payload, supabase=supabase)

    user_skill_names = _list_user_skill_names(user_id=user_id, supabase=supabase)

    matches_payload: list[dict[str, Any]] = []
    scored_pairs: list[tuple[dict[str, Any], dict[str, Any]]] = []
    for persisted in persisted_jobs:
        scored = score_job(
            user_id=user_id,
            resume_id=resume_id,
            user_skill_names=user_skill_names,
            title=persisted.get("title", ""),
            description=persisted.get("description"),
            requirements=persisted.get("requirements"),
            supabase=supabase,
        )
        matches_payload.append({
            "user_id": user_id,
            "job_id": persisted["id"],
            "resume_id": resume_id,
            "fit_score": scored["fit_score"],
            "matched_skills": scored["matched_skills"],
            "missing_skills": scored["missing_skills"],
            "explanation": scored["explanation"],
            "evidence_chunks": scored["evidence_chunk_ids"],
        })
        scored_pairs.append((persisted, scored))

    persisted_matches = _persist_matches(
        matches_payload=matches_payload, supabase=supabase
    )

    matches_by_job_id = {m["job_id"]: m for m in persisted_matches if m.get("job_id")}
    matches_out: list[dict[str, Any]] = []
    for job, scored in scored_pairs:
        match_row = matches_by_job_id.get(job["id"])
        if not match_row:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Job match persistence returned no row for job {job['id']}.",
            )
        matches_out.append({
            "match_id": match_row.get("id"),
            "job": job,
            "fit_score": scored["fit_score"],
            "matched_skills": scored["matched_skills"],
            "missing_skills": scored["missing_skills"],
            "explanation": scored["explanation"],
        })

    matches_out.sort(key=lambda m: m["fit_score"], reverse=True)
    return {"search_id": search_id, "matches": matches_out}


def save_to_tracker(
    *, user_id: str, match_id: str, supabase: Any
) -> dict[str, Any]:
    """Insert an `applications` row linking the existing job_match to the user."""
    match_response = (
        supabase.table("job_matches")
        .select("id, user_id, job_id, resume_id")
        .eq("id", match_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    match = _row(match_response)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job match not found.",
        )

    application_payload = {
        "user_id": user_id,
        "job_id": match["job_id"],
        "job_match_id": match["id"],
        "status": "saved",
    }
    response = supabase.table("applications").insert(application_payload).execute()
    application = _row(response)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to insert application row.",
        )
    return application
