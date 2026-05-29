"""Shared RAG context retrieval for assistant and career generation features."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

from supabase import Client

from app.core.supabase_errors import run_supabase
from app.core.enums import ResumeStatus
from app.cv_intelligence.services import resume_service
from app.cv_intelligence.services._helpers import _rows
from app.cv_intelligence.services.retrieval_service import search_chunks

# Intent-aware retrieval tuning
_INTENT_TOP_K: dict[str, int] = {
    "cover_letter": 8,
    "skill_gap": 6,
    "readiness_check": 6,
    "roadmap_generation": 6,
    "general": 5,
}

_INTENT_QUERY_HINTS: dict[str, str] = {
    "cover_letter": "work experience projects achievements responsibilities",
    "skill_gap": "skills experience education certifications",
    "readiness_check": "skills experience projects education qualifications",
    "roadmap_generation": "skills experience education background",
}

_MAX_CHUNK_CHARS = 600
_MAX_TOTAL_CHARS = 6000


@dataclass
class RagContextResult:
    """Retrieved CV context for downstream LLM features."""

    resume_id: Optional[str] = None
    resume_status: Optional[str] = None
    has_resume: bool = False
    chunks: list[dict[str, Any]] = field(default_factory=list)
    chunk_ids: list[str] = field(default_factory=list)
    context_text: str = ""
    user_skills: list[str] = field(default_factory=list)
    empty_reason: Optional[str] = None


def _build_retrieval_query(user_query: str, intent: Optional[str]) -> str:
    query = (user_query or "").strip()
    if not query:
        return "resume skills experience education"
    hint = _INTENT_QUERY_HINTS.get(intent or "", "")
    if hint:
        return f"{query}\n{hint}"
    return query


def _resolve_top_k(intent: Optional[str], top_k: Optional[int]) -> int:
    if top_k is not None:
        return max(1, min(int(top_k), 20))
    return _INTENT_TOP_K.get(intent or "general", 5)


def format_chunks_as_context(chunks: list[dict[str, Any]]) -> str:
    """Format retrieved chunks into a single context string for LLM prompts."""
    if not chunks:
        return ""

    parts: list[str] = []
    total_chars = 0
    for i, chunk in enumerate(chunks, 1):
        section = chunk.get("section_name") or "General"
        text = (chunk.get("chunk_text") or "").strip()[:_MAX_CHUNK_CHARS]
        part = f"[Excerpt {i} — {section}]\n{text}"
        if total_chars + len(part) > _MAX_TOTAL_CHARS:
            break
        parts.append(part)
        total_chars += len(part)
    return "\n\n".join(parts)


def _fetch_user_skills(
    supabase: Client,
    user_id: str,
    resume_id: Optional[str],
) -> list[str]:
    query = (
        supabase.table("user_skills")
        .select("skill_name")
        .eq("user_id", user_id)
        .order("skill_name")
    )
    if resume_id:
        query = query.eq("resume_id", resume_id)
    response = run_supabase("list user skills for RAG", query.execute)
    names: list[str] = []
    seen: set[str] = set()
    for row in _rows(response):
        name = (row.get("skill_name") or "").strip()
        if name and name.lower() not in seen:
            seen.add(name.lower())
            names.append(name)
    return names


def retrieve_cv_context(
    *,
    user_id: str,
    query: str,
    supabase: Client,
    resume_id: Optional[str] = None,
    top_k: Optional[int] = None,
    intent: Optional[str] = None,
) -> RagContextResult:
    """
    Resolve active resume, retrieve semantic chunks, and build LLM-ready context.

    Returns empty_reason when no processed resume exists or retrieval yields no chunks.
    """
    resolved_resume_id = resume_id
    resume_status: Optional[str] = None

    if resolved_resume_id:
        resume = resume_service.get_resume(user_id, resolved_resume_id)
        resume_status = resume.status
        if resume.status != ResumeStatus.PROCESSED.value:
            return RagContextResult(
                resume_id=resolved_resume_id,
                resume_status=resume_status,
                has_resume=False,
                empty_reason=(
                    "Your resume is still processing. Please wait and try again."
                ),
            )
    else:
        resolved_resume_id = resume_service.get_active_resume_id(user_id)
        if not resolved_resume_id:
            return RagContextResult(
                has_resume=False,
                empty_reason=(
                    "No processed resume found. Upload your CV at /resume first."
                ),
            )
        resume = resume_service.get_resume(user_id, resolved_resume_id)
        resume_status = resume.status

    retrieval_query = _build_retrieval_query(query, intent)
    k = _resolve_top_k(intent, top_k)
    chunks = search_chunks(
        user_id=user_id,
        query=retrieval_query,
        supabase=supabase,
        resume_id=resolved_resume_id,
        top_k=k,
    )

    user_skills = _fetch_user_skills(supabase, user_id, resolved_resume_id)
    chunk_ids = [str(c["chunk_id"]) for c in chunks if c.get("chunk_id")]

    if not chunks:
        return RagContextResult(
            resume_id=resolved_resume_id,
            resume_status=resume_status,
            has_resume=True,
            user_skills=user_skills,
            empty_reason=(
                "No relevant CV sections matched this query. "
                "Try rephrasing or upload a more detailed resume."
            ),
        )

    return RagContextResult(
        resume_id=resolved_resume_id,
        resume_status=resume_status,
        has_resume=True,
        chunks=chunks,
        chunk_ids=chunk_ids,
        context_text=format_chunks_as_context(chunks),
        user_skills=user_skills,
    )
