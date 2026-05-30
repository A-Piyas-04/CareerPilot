"""RAG-grounded career artifact generation and persistence."""
from __future__ import annotations

from typing import Any, Optional

from fastapi import HTTPException, status

from app.core.database import get_supabase_client
from app.core.supabase_errors import run_supabase
from app.cv_intelligence.services import llm_service, rag_context_service
from app.cv_intelligence.services._helpers import _row, _rows
from app.cv_intelligence.services.skill_extractor import extract_skills


def _require_rag_context(
    *,
    user_id: str,
    query: str,
    resume_id: Optional[str],
    intent: str,
) -> rag_context_service.RagContextResult:
    supabase = get_supabase_client()
    rag = rag_context_service.retrieve_cv_context(
        user_id=user_id,
        query=query,
        supabase=supabase,
        resume_id=resume_id,
        intent=intent,
    )
    if not rag.has_resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=rag.empty_reason or "No processed resume found. Upload your CV first.",
        )
    if not rag.chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=rag.empty_reason or "No relevant CV sections found for this request.",
        )
    return rag


def generate_and_save_cover_letter(
    *,
    user_id: str,
    job_description: str,
    resume_id: Optional[str] = None,
    job_id: Optional[str] = None,
    title: Optional[str] = None,
    target_role: Optional[str] = None,
    company_name: Optional[str] = None,
) -> dict[str, Any]:
    rag = _require_rag_context(
        user_id=user_id,
        query=job_description,
        resume_id=resume_id,
        intent="cover_letter",
    )
    content = llm_service.generate_cover_letter(
        job_description=job_description,
        chunks=rag.chunks,
        target_role=target_role,
        company_name=company_name,
    )
    supabase = get_supabase_client()
    row: dict[str, Any] = {
        "user_id": user_id,
        "resume_id": rag.resume_id,
        "job_id": job_id,
        "title": title or f"Cover letter — {target_role or 'Role'}",
        "content": content,
        "version": 1,
    }
    metadata = {
        "used_resume_chunks": rag.chunk_ids,
        "target_role": target_role,
        "company_name": company_name,
    }

    def _insert_cover_letter() -> Any:
        payload = {**row, "metadata": metadata}
        try:
            return supabase.table("cover_letters").insert(payload).execute()
        except Exception:
            return supabase.table("cover_letters").insert(row).execute()

    response = run_supabase("insert cover letter", _insert_cover_letter)
    inserted = _row(response)
    return {
        "id": str(inserted["id"]),
        "title": inserted.get("title"),
        "content": inserted.get("content"),
        "resume_id": rag.resume_id,
        "used_resume_chunks": rag.chunk_ids,
    }


def analyze_and_save_skill_gap(
    *,
    user_id: str,
    target_role: str,
    job_description: str = "",
    resume_id: Optional[str] = None,
    job_id: Optional[str] = None,
) -> dict[str, Any]:
    query = f"{target_role}\n{job_description}".strip()
    rag = _require_rag_context(
        user_id=user_id,
        query=query,
        resume_id=resume_id,
        intent="skill_gap",
    )
    jd_skills = [s["skill_name"] for s in extract_skills(job_description or target_role)]
    analysis = llm_service.analyze_skill_gap(
        target_role=target_role,
        job_description=job_description,
        chunks=rag.chunks,
        user_skills=rag.user_skills,
        jd_skills=jd_skills,
    )
    recommendations = analysis.get("recommendations") or {}
    if isinstance(recommendations, dict):
        recommendations["evidence_chunk_ids"] = rag.chunk_ids
    current = analysis.get("current_skills") or []
    required = analysis.get("required_skills") or jd_skills
    missing = analysis.get("missing_skills") or sorted(set(required) - set(current))

    supabase = get_supabase_client()
    row = {
        "user_id": user_id,
        "resume_id": rag.resume_id,
        "job_id": job_id,
        "target_role": target_role,
        "current_skills": current,
        "required_skills": required,
        "missing_skills": missing,
        "recommendations": recommendations,
    }
    response = run_supabase(
        "insert skill gap analysis",
        lambda: supabase.table("skill_gap_analysis").insert(row).execute(),
    )
    inserted = _row(response)
    return {
        "id": str(inserted["id"]),
        "target_role": target_role,
        "current_skills": current,
        "required_skills": required,
        "missing_skills": missing,
        "recommendations": recommendations,
        "used_resume_chunks": rag.chunk_ids,
        "job_id": job_id,
        "resume_id": rag.resume_id,
        "created_at": inserted.get("created_at"),
    }


def list_skill_gap_analyses(
    *, user_id: str, limit: int = 50
) -> list[dict[str, Any]]:
    supabase = get_supabase_client()
    response = (
        supabase.table("skill_gap_analysis")
        .select(
            "id, target_role, current_skills, required_skills, missing_skills, "
            "job_id, resume_id, created_at"
        )
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return _rows(response)


def get_skill_gap_analysis(*, user_id: str, analysis_id: str) -> dict[str, Any]:
    supabase = get_supabase_client()
    response = (
        supabase.table("skill_gap_analysis")
        .select("*")
        .eq("id", analysis_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    row = _row(response)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill gap analysis not found.",
        )
    return row


def generate_and_save_roadmap(
    *,
    user_id: str,
    target_role: str,
    duration_weeks: int = 8,
    resume_id: Optional[str] = None,
    job_description: str = "",
) -> dict[str, Any]:
    query = f"{target_role}\n{job_description}".strip()
    rag = _require_rag_context(
        user_id=user_id,
        query=query,
        resume_id=resume_id,
        intent="roadmap_generation",
    )
    jd_skills = [s["skill_name"] for s in extract_skills(job_description or target_role)]
    missing = sorted(set(jd_skills) - set(rag.user_skills))
    roadmap_data = llm_service.generate_roadmap(
        target_role=target_role,
        chunks=rag.chunks,
        user_skills=rag.user_skills,
        missing_skills=missing,
        duration_weeks=duration_weeks,
    )
    overview = roadmap_data.get("overview") or ""
    items = roadmap_data.get("items") or []

    supabase = get_supabase_client()
    roadmap_resp = run_supabase(
        "insert roadmap",
        lambda: (
            supabase.table("roadmaps")
            .insert(
                {
                    "user_id": user_id,
                    "target_role": target_role,
                    "duration_weeks": duration_weeks,
                    "overview": overview,
                    "progress_percent": 0,
                }
            )
            .execute()
        ),
    )
    roadmap_row = _row(roadmap_resp)
    roadmap_id = str(roadmap_row["id"])

    item_rows = []
    for item in items[:duration_weeks]:
        item_rows.append(
            {
                "roadmap_id": roadmap_id,
                "user_id": user_id,
                "week_number": int(item.get("week_number") or len(item_rows) + 1),
                "title": item.get("title") or f"Week {len(item_rows) + 1}",
                "description": item.get("description") or "",
                "resources": item.get("resources") or [],
                "status": "todo",
            }
        )
    if item_rows:
        run_supabase(
            "insert roadmap items",
            lambda: supabase.table("roadmap_items").insert(item_rows).execute(),
        )

    return {
        "id": roadmap_id,
        "target_role": target_role,
        "duration_weeks": duration_weeks,
        "overview": overview,
        "item_count": len(item_rows),
        "used_resume_chunks": rag.chunk_ids,
        "items": item_rows,
    }
