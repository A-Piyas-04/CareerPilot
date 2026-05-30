"""Job hunter orchestration: search → score → persist + save-to-tracker."""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from fastapi import HTTPException, status

from app.core.enums import ResumeStatus
from app.job_intelligence.services._helpers import _row, _rows
from app.job_intelligence.services.job_scorer import score_job
from app.job_intelligence.services.sources.base import JobSource

_SCORE_MAX_WORKERS = 8


def validate_resume_for_scoring(*, user_id: str, resume_id: str, supabase: Any) -> None:
    """Ensure the resume exists, is owned by the user, and is RAG-ready."""
    response = (
        supabase.table("resumes")
        .select("id, status")
        .eq("id", resume_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    row = _row(response)
    if not row:
        raise ValueError("Resume not found.")
    if row.get("status") != ResumeStatus.PROCESSED.value:
        raise ValueError("Upload and process your CV first.")


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


def _lookup_existing_job(
    *, source: str | None, source_url: str | None, supabase: Any
) -> dict[str, Any] | None:
    if not source or not source_url:
        return None
    response = (
        supabase.table("jobs")
        .select("*")
        .eq("source", source)
        .eq("source_url", source_url)
        .limit(1)
        .execute()
    )
    return _row(response)


def _persist_jobs(
    *, jobs_payload: list[dict[str, Any]], supabase: Any
) -> list[dict[str, Any]]:
    if not jobs_payload:
        return []

    persisted: list[dict[str, Any]] = []
    to_insert: list[dict[str, Any]] = []

    for payload in jobs_payload:
        existing = _lookup_existing_job(
            source=payload.get("source"),
            source_url=payload.get("source_url"),
            supabase=supabase,
        )
        if existing:
            update_payload = {
                key: value
                for key, value in payload.items()
                if key not in ("id",) and value is not None
            }
            if update_payload.get("search_id"):
                response = (
                    supabase.table("jobs")
                    .update(update_payload)
                    .eq("id", existing["id"])
                    .execute()
                )
                updated = _row(response) or {**existing, **update_payload}
                persisted.append({**existing, **updated, "id": existing["id"]})
            else:
                persisted.append(existing)
        else:
            to_insert.append(payload)

    if to_insert:
        response = supabase.table("jobs").insert(to_insert).execute()
        persisted.extend(_rows(response))

    return persisted


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


def _score_single_job(
    *,
    user_id: str,
    resume_id: str,
    user_skill_names: list[str],
    persisted: dict[str, Any],
    supabase: Any,
) -> tuple[dict[str, Any], dict[str, Any]]:
    scored = score_job(
        user_id=user_id,
        resume_id=resume_id,
        user_skill_names=user_skill_names,
        title=persisted.get("title", ""),
        description=persisted.get("description"),
        requirements=persisted.get("requirements"),
        supabase=supabase,
    )
    return persisted, scored


def _score_jobs_parallel(
    *,
    user_id: str,
    resume_id: str,
    user_skill_names: list[str],
    persisted_jobs: list[dict[str, Any]],
    supabase: Any,
) -> list[tuple[dict[str, Any], dict[str, Any]]]:
    if not persisted_jobs:
        return []

    if len(persisted_jobs) == 1:
        return [
            _score_single_job(
                user_id=user_id,
                resume_id=resume_id,
                user_skill_names=user_skill_names,
                persisted=persisted_jobs[0],
                supabase=supabase,
            )
        ]

    scored_pairs: list[tuple[dict[str, Any], dict[str, Any]]] = []
    with ThreadPoolExecutor(max_workers=_SCORE_MAX_WORKERS) as executor:
        futures = {
            executor.submit(
                _score_single_job,
                user_id=user_id,
                resume_id=resume_id,
                user_skill_names=user_skill_names,
                persisted=job,
                supabase=supabase,
            ): job
            for job in persisted_jobs
        }
        for future in as_completed(futures):
            scored_pairs.append(future.result())

    return scored_pairs


def _build_match_summary(
    *,
    job: dict[str, Any],
    scored: dict[str, Any],
    match_row: dict[str, Any] | None,
    tracker_application_id: str | None = None,
) -> dict[str, Any]:
    return {
        "match_id": match_row.get("id") if match_row else None,
        "job": job,
        "fit_score": scored["fit_score"],
        "matched_skills": scored["matched_skills"],
        "missing_skills": scored["missing_skills"],
        "explanation": scored["explanation"],
        "evidence_chunks": scored.get("evidence_chunks") or [],
        "skills_component": scored.get("skills_component", 0.0),
        "mean_similarity": scored.get("mean_similarity", 0.0),
        "tracker_application_id": tracker_application_id,
    }


def _tracker_ids_by_job(
    *, user_id: str, job_ids: list[str], supabase: Any
) -> dict[str, str]:
    if not job_ids:
        return {}
    response = (
        supabase.table("applications")
        .select("id, job_id")
        .eq("user_id", user_id)
        .in_("job_id", job_ids)
        .execute()
    )
    mapping: dict[str, str] = {}
    for row in _rows(response):
        job_id = row.get("job_id")
        app_id = row.get("id")
        if job_id and app_id and job_id not in mapping:
            mapping[str(job_id)] = str(app_id)
    return mapping


def search_and_match(
    *,
    user_id: str,
    resume_id: str,
    query: str,
    location: str | None,
    source: JobSource,
    supabase: Any,
    limit: int = 20,
) -> dict[str, Any]:
    """Run a search against `source`, score each result, persist everything."""
    validate_resume_for_scoring(user_id=user_id, resume_id=resume_id, supabase=supabase)

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

    scored_pairs = _score_jobs_parallel(
        user_id=user_id,
        resume_id=resume_id,
        user_skill_names=user_skill_names,
        persisted_jobs=persisted_jobs,
        supabase=supabase,
    )

    matches_payload: list[dict[str, Any]] = []
    for persisted, scored in scored_pairs:
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

    persisted_matches = _persist_matches(
        matches_payload=matches_payload, supabase=supabase
    )

    matches_by_job_id = {m["job_id"]: m for m in persisted_matches if m.get("job_id")}
    job_ids = [job["id"] for job, _ in scored_pairs if job.get("id")]
    tracker_by_job = _tracker_ids_by_job(
        user_id=user_id, job_ids=job_ids, supabase=supabase
    )

    matches_out: list[dict[str, Any]] = []
    for job, scored in scored_pairs:
        match_row = matches_by_job_id.get(job["id"])
        if not match_row:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Job match persistence returned no row for job {job['id']}.",
            )
        matches_out.append(
            _build_match_summary(
                job=job,
                scored=scored,
                match_row=match_row,
                tracker_application_id=tracker_by_job.get(str(job["id"])),
            )
        )

    matches_out.sort(key=lambda m: m["fit_score"], reverse=True)
    return {"search_id": search_id, "matches": matches_out}


def _build_tracker_notes(*, fit_score: float, missing_skills: list[str]) -> str | None:
    parts = [f"Fit score: {fit_score:.0f}%"]
    if missing_skills:
        preview = ", ".join(missing_skills[:5])
        if len(missing_skills) > 5:
            preview += "…"
        parts.append(f"Skill gaps: {preview}")
    return " · ".join(parts)


def save_to_tracker(
    *, user_id: str, match_id: str, supabase: Any
) -> dict[str, Any]:
    """Insert or return an applications row linking the job_match to the user."""
    match_response = (
        supabase.table("job_matches")
        .select(
            "id, user_id, job_id, resume_id, fit_score, matched_skills, "
            "missing_skills, jobs(title, company, location, deadline)"
        )
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

    job_id = match.get("job_id")
    if not job_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job match has no linked job.",
        )

    existing_response = (
        supabase.table("applications")
        .select("*")
        .eq("user_id", user_id)
        .eq("job_id", job_id)
        .limit(1)
        .execute()
    )
    existing = _row(existing_response)
    if existing:
        return {**existing, "already_saved": True}

    job = match.get("jobs") or {}
    if isinstance(job, list):
        job = job[0] if job else {}

    application_payload = {
        "user_id": user_id,
        "job_id": job_id,
        "job_match_id": match["id"],
        "status": "saved",
        "manual_job_title": job.get("title"),
        "manual_company": job.get("company"),
        "manual_location": job.get("location"),
        "deadline": job.get("deadline"),
        "notes": _build_tracker_notes(
            fit_score=float(match.get("fit_score") or 0),
            missing_skills=match.get("missing_skills") or [],
        ),
    }
    response = supabase.table("applications").insert(application_payload).execute()
    application = _row(response)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to insert application row.",
        )
    return {**application, "already_saved": False}


def get_match_detail(
    *, user_id: str, match_id: str, supabase: Any
) -> dict[str, Any]:
    """Return a single match with job data and tracker link."""
    response = (
        supabase.table("job_matches")
        .select(
            "id, job_id, fit_score, matched_skills, missing_skills, explanation, "
            "evidence_chunks, jobs(*)"
        )
        .eq("id", match_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    row = _row(response)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job match not found.",
        )

    job = row.get("jobs") or {}
    tracker_by_job = _tracker_ids_by_job(
        user_id=user_id,
        job_ids=[str(row["job_id"])] if row.get("job_id") else [],
        supabase=supabase,
    )

    evidence_chunks: list[dict[str, Any]] = []
    chunk_ids = row.get("evidence_chunks") or []
    if chunk_ids:
        chunks_response = (
            supabase.table("resume_chunks")
            .select("id, section_name, chunk_text")
            .in_("id", chunk_ids)
            .execute()
        )
        chunk_by_id = {str(c["id"]): c for c in _rows(chunks_response)}
        for chunk_id in chunk_ids[:5]:
            chunk = chunk_by_id.get(str(chunk_id))
            if not chunk:
                continue
            text = (chunk.get("chunk_text") or "").strip()
            if len(text) > 280:
                text = text[:280].rstrip() + "…"
            evidence_chunks.append({
                "chunk_id": str(chunk_id),
                "section_name": chunk.get("section_name") or "CV section",
                "snippet": text,
                "similarity": 0.0,
            })

    return _build_match_summary(
        job=job,
        scored={
            "fit_score": float(row.get("fit_score") or 0),
            "matched_skills": row.get("matched_skills") or [],
            "missing_skills": row.get("missing_skills") or [],
            "explanation": row.get("explanation") or "",
            "evidence_chunks": evidence_chunks,
        },
        match_row=row,
        tracker_application_id=tracker_by_job.get(str(row.get("job_id"))),
    )


def list_matches_for_user(
    *,
    user_id: str,
    supabase: Any,
    resume_id: str | None = None,
    search_id: str | None = None,
    job_id: str | None = None,
    min_score: float = 0.0,
    saved_only: bool = False,
    limit: int = 50,
) -> list[dict[str, Any]]:
    """Return stored matches with optional filters."""
    select_cols = (
        "id, job_id, fit_score, matched_skills, missing_skills, explanation, jobs!inner(*)"
        if search_id
        else "id, job_id, fit_score, matched_skills, missing_skills, explanation, jobs(*)"
    )
    query = (
        supabase.table("job_matches")
        .select(select_cols)
        .eq("user_id", user_id)
        .order("fit_score", desc=True)
        .limit(limit)
    )
    if resume_id:
        query = query.eq("resume_id", resume_id)
    if job_id:
        query = query.eq("job_id", job_id)
    if search_id:
        query = query.eq("jobs.search_id", search_id)

    rows = _rows(query.execute())
    job_ids = [str(r["job_id"]) for r in rows if r.get("job_id")]
    tracker_by_job = _tracker_ids_by_job(
        user_id=user_id, job_ids=job_ids, supabase=supabase
    )

    summaries: list[dict[str, Any]] = []
    for row in rows:
        if row.get("fit_score", 0) < min_score:
            continue
        job = row.get("jobs") or {}
        tracker_id = tracker_by_job.get(str(row.get("job_id")))
        if saved_only and not tracker_id:
            continue
        summaries.append(
            _build_match_summary(
                job=job,
                scored={
                    "fit_score": float(row.get("fit_score", 0)),
                    "matched_skills": row.get("matched_skills") or [],
                    "missing_skills": row.get("missing_skills") or [],
                    "explanation": row.get("explanation") or "",
                    "evidence_chunks": [],
                },
                match_row=row,
                tracker_application_id=tracker_id,
            )
        )
    return summaries
