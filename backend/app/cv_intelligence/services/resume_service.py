"""Resume service — orchestrates the full CV ingestion pipeline and read operations."""
from __future__ import annotations

from pathlib import Path
from typing import Any, Optional

from fastapi import HTTPException, status

from app.core.database import get_supabase_client
from app.core.supabase_errors import raise_http_for_supabase, run_supabase
from app.core.enums import ResumeStatus
from app.cv_intelligence.models.resume import Resume
from app.cv_intelligence.models.resume_chunk import ResumeChunk
from app.cv_intelligence.models.resume_section import ResumeSection
from app.cv_intelligence.models.user_skill import UserSkill
from app.cv_intelligence.services._helpers import _row, _rows
from app.core.config import settings
from app.cv_intelligence.services.chunker import chunk_sections
from app.cv_intelligence.services.embedding_service import embed_batch
from app.cv_intelligence.services.resume_parser import extract_text, validate_file
from app.cv_intelligence.services.section_detector import SECTION_HEADINGS, detect_sections
from app.cv_intelligence.services.skill_extractor import extract_skills

# Match section_detector canonical names (+ general fallback from parsing).
ALLOWED_BUILDER_SECTIONS = frozenset(SECTION_HEADINGS.keys()) | {"general"}

MAX_BUILDER_SECTIONS = 12


def _not_found(resource: str = "Resume") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} not found",
    )


def _normalize_builder_section_name(name: str) -> str:
    """Map unknown section keys to a safe canonical name for rebuild."""
    lowered = name.strip().lower()
    if lowered in ALLOWED_BUILDER_SECTIONS:
        return lowered
    if lowered in SECTION_HEADINGS:
        return lowered
    return "summary"


def _heading_label(section_name: str) -> str:
    """Human-readable heading for raw_text composition."""
    return section_name.replace("_", " ").title()


def compose_raw_text(sections: list[dict[str, Any]]) -> str:
    """Join builder/upload sections into plain text for skill extraction."""
    parts: list[str] = []
    for section in sections:
        name = section["section_name"]
        content = (section.get("content") or "").strip()
        if not content:
            continue
        parts.append(f"{_heading_label(name)}\n{content}")
    return "\n\n".join(parts)


def validate_builder_sections(sections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Normalize and validate builder section payloads.
    Returns list of dicts with section_name, content, section_order.
    """
    if not sections:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one section is required.",
        )
    if len(sections) > MAX_BUILDER_SECTIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Maximum {MAX_BUILDER_SECTIONS} sections allowed.",
        )

    normalized: list[dict[str, Any]] = []
    for order, item in enumerate(sections):
        name = (item.get("section_name") or "").strip().lower()
        content = (item.get("content") or "").strip()
        if name not in ALLOWED_BUILDER_SECTIONS:
            name = _normalize_builder_section_name(name)
        if not name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Each section must have a section_name.",
            )
        if name not in ALLOWED_BUILDER_SECTIONS:
            allowed = ", ".join(sorted(ALLOWED_BUILDER_SECTIONS))
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid section_name '{name}'. Allowed: {allowed}.",
            )
        if not content:
            continue
        normalized.append(
            {
                "section_name": name,
                "content": content,
                "section_order": order,
            }
        )

    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one section must have non-empty content.",
        )
    return normalized


# ---------------------------------------------------------------------------
# Read operations
# ---------------------------------------------------------------------------

def get_active_resume_id(user_id: str) -> Optional[str]:
    """Return the active processed resume id for the user, if any."""
    response = run_supabase(
        "get active resume",
        lambda: (
            get_supabase_client()
            .table("resumes")
            .select("id")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .eq("status", ResumeStatus.PROCESSED.value)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        ),
    )
    rows = _rows(response)
    if not rows:
        return None
    return str(rows[0]["id"])


def list_resumes(user_id: str) -> list[Resume]:
    """Return all resumes for the user, newest first."""
    response = run_supabase(
        "list resumes",
        lambda: (
            get_supabase_client()
            .table("resumes")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        ),
    )
    return [Resume(**item) for item in _rows(response)]


def get_resume(user_id: str, resume_id: str) -> Resume:
    """Return a single resume, enforcing ownership."""
    return _get_owned_resume(user_id, resume_id)


def get_resume_detail(user_id: str, resume_id: str) -> dict[str, Any]:
    """
    Return resume metadata together with its sections, extracted skills,
    and the total chunk count.
    """
    resume = _get_owned_resume(user_id, resume_id)

    sections_resp = run_supabase(
        "list resume sections",
        lambda: (
            get_supabase_client()
            .table("resume_sections")
            .select("*")
            .eq("resume_id", resume_id)
            .eq("user_id", user_id)
            .order("section_order")
            .execute()
        ),
    )
    sections = [ResumeSection(**s) for s in _rows(sections_resp)]

    skills_resp = run_supabase(
        "list resume skills",
        lambda: (
            get_supabase_client()
            .table("user_skills")
            .select("*")
            .eq("resume_id", resume_id)
            .eq("user_id", user_id)
            .execute()
        ),
    )
    skills = [UserSkill(**sk) for sk in _rows(skills_resp)]

    chunk_count_resp = run_supabase(
        "count resume chunks",
        lambda: (
            get_supabase_client()
            .table("resume_chunks")
            .select("id", count="exact")
            .eq("resume_id", resume_id)
            .eq("user_id", user_id)
            .execute()
        ),
    )
    chunk_count = getattr(chunk_count_resp, "count", 0) or len(_rows(chunk_count_resp))

    return {
        "resume": resume,
        "sections": sections,
        "skills": skills,
        "chunk_count": chunk_count,
    }


def get_resume_chunks(user_id: str, resume_id: str) -> list[ResumeChunk]:
    """Return all chunks for a resume, enforcing ownership."""
    _get_owned_resume(user_id, resume_id)
    response = run_supabase(
        "list resume chunks",
        lambda: (
            get_supabase_client()
            .table("resume_chunks")
            .select(
                "id, resume_id, user_id, section_id, section_name, chunk_index, "
                "chunk_text, token_count, metadata, created_at"
            )
            .eq("resume_id", resume_id)
            .eq("user_id", user_id)
            .order("chunk_index")
            .execute()
        ),
    )
    return [ResumeChunk(**item) for item in _rows(response)]


# ---------------------------------------------------------------------------
# Upload / processing pipeline
# ---------------------------------------------------------------------------

def _ingest_sections(
    supabase: Any,
    user_id: str,
    resume_id: str,
    sections: list[dict[str, Any]],
    raw_text: str,
) -> Resume:
    """
    Shared pipeline: insert sections → chunk → embed → skills → deactivate others
    → mark processed. Caller must ensure resume row exists and is processing.
    """
    section_rows = [
        {
            "resume_id": resume_id,
            "user_id": user_id,
            "section_name": s["section_name"],
            "section_order": s["section_order"],
            "content": s["content"],
            "metadata": s.get("metadata") or {},
        }
        for s in sections
    ]
    section_insert_resp = (
        supabase.table("resume_sections").insert(section_rows).execute()
    )
    inserted_sections = _rows(section_insert_resp)

    section_id_map: dict[str, str] = {
        r["section_name"]: r["id"] for r in inserted_sections
    }

    chunks = chunk_sections(sections)
    chunk_texts = [c["chunk_text"] for c in chunks]
    embeddings = embed_batch(chunk_texts)

    embedding_column = settings.embedding_active_column.strip() or "embedding"
    chunk_rows = [
        {
            "resume_id": resume_id,
            "user_id": user_id,
            "section_id": section_id_map.get(c["section_name"]),
            "section_name": c["section_name"],
            "chunk_index": c["chunk_index"],
            "chunk_text": c["chunk_text"],
            "token_count": c["token_count"],
            embedding_column: embeddings[i],
            "metadata": {},
        }
        for i, c in enumerate(chunks)
    ]
    supabase.table("resume_chunks").insert(chunk_rows).execute()

    skills = extract_skills(raw_text)

    if skills:
        skill_rows = [
            {
                "user_id": user_id,
                "resume_id": resume_id,
                "skill_name": sk["skill_name"],
                "category": sk["category"],
                "evidence": sk["evidence"],
                "source": "resume",
            }
            for sk in skills
        ]
        supabase.table("user_skills").upsert(
            skill_rows,
            on_conflict="user_id,skill_name",
            ignore_duplicates=True,
        ).execute()

    (
        supabase.table("resumes")
        .update({"is_active": False})
        .eq("user_id", user_id)
        .neq("id", resume_id)
        .execute()
    )

    parsed_summary = {
        "section_count": len(sections),
        "chunk_count": len(chunks),
        "skill_count": len(skills),
        "section_names": [s["section_name"] for s in sections],
    }
    update_resp = (
        supabase.table("resumes")
        .update(
            {
                "status": ResumeStatus.PROCESSED.value,
                "raw_text": raw_text,
                "parsed_summary": parsed_summary,
                "error_message": None,
                "is_active": True,
            }
        )
        .eq("id", resume_id)
        .eq("user_id", user_id)
        .execute()
    )
    final = _row(update_resp)
    if not final:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not finalize resume processing.",
        )
    return Resume(**final)


def process_resume(user_id: str, filename: str, file_bytes: bytes) -> Resume:
    """
    Full CV ingestion pipeline from PDF/DOCX upload.
    """
    supabase = get_supabase_client()
    file_type = Path(filename).suffix.lower().lstrip(".")

    validate_file(filename, len(file_bytes))

    insert_resp = run_supabase(
        "create resume",
        lambda: (
            supabase.table("resumes")
            .insert(
                {
                    "user_id": user_id,
                    "file_name": filename,
                    "file_type": file_type,
                    "status": ResumeStatus.PROCESSING.value,
                    "is_active": True,
                }
            )
            .execute()
        ),
    )
    created = _row(insert_resp)
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create resume record.",
        )
    resume_id: str = created["id"]

    try:
        raw_text = extract_text(filename, file_bytes)
        sections = detect_sections(raw_text)
        return _ingest_sections(supabase, user_id, resume_id, sections, raw_text)

    except HTTPException:
        _mark_failed(supabase, resume_id, user_id, "Resume processing failed.")
        raise
    except Exception as exc:
        _mark_failed(supabase, resume_id, user_id, str(exc))
        raise_http_for_supabase(exc, context="process resume")


def process_resume_from_sections(
    user_id: str,
    title: str,
    sections: list[dict[str, Any]],
) -> Resume:
    """Create a new resume from in-app builder sections."""
    supabase = get_supabase_client()
    normalized = validate_builder_sections(sections)
    raw_text = compose_raw_text(normalized)
    file_name = title.strip() or "My CV"

    insert_resp = run_supabase(
        "create resume from builder",
        lambda: (
            supabase.table("resumes")
            .insert(
                {
                    "user_id": user_id,
                    "file_name": file_name,
                    "file_type": "builder",
                    "status": ResumeStatus.PROCESSING.value,
                    "is_active": True,
                }
            )
            .execute()
        ),
    )
    created = _row(insert_resp)
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create resume record.",
        )
    resume_id: str = created["id"]

    try:
        return _ingest_sections(supabase, user_id, resume_id, normalized, raw_text)
    except HTTPException:
        _mark_failed(supabase, resume_id, user_id, "Resume processing failed.")
        raise
    except Exception as exc:
        _mark_failed(supabase, resume_id, user_id, str(exc))
        raise_http_for_supabase(exc, context="build resume")


def _clear_resume_derived_data(
    supabase: Any, user_id: str, resume_id: str
) -> None:
    """Remove sections, chunks, and resume-linked skills before rebuild."""
    supabase.table("resume_chunks").delete().eq("resume_id", resume_id).eq(
        "user_id", user_id
    ).execute()
    supabase.table("resume_sections").delete().eq("resume_id", resume_id).eq(
        "user_id", user_id
    ).execute()
    supabase.table("user_skills").delete().eq("resume_id", resume_id).eq(
        "user_id", user_id
    ).execute()


def rebuild_resume_from_sections(
    user_id: str,
    resume_id: str,
    title: str,
    sections: list[dict[str, Any]],
) -> Resume:
    """Rebuild an existing resume from updated builder sections."""
    supabase = get_supabase_client()
    _get_owned_resume(user_id, resume_id)
    normalized = validate_builder_sections(sections)
    raw_text = compose_raw_text(normalized)
    file_name = title.strip() or "My CV"

    try:
        supabase.table("resumes").update(
            {
                "file_name": file_name,
                "file_type": "builder",
                "status": ResumeStatus.PROCESSING.value,
                "error_message": None,
            }
        ).eq("id", resume_id).eq("user_id", user_id).execute()

        _clear_resume_derived_data(supabase, user_id, resume_id)
        return _ingest_sections(supabase, user_id, resume_id, normalized, raw_text)

    except HTTPException:
        _mark_failed(supabase, resume_id, user_id, "Resume rebuild failed.")
        raise
    except Exception as exc:
        _mark_failed(supabase, resume_id, user_id, str(exc))
        raise_http_for_supabase(exc, context="rebuild resume")


# ---------------------------------------------------------------------------
# Delete operation
# ---------------------------------------------------------------------------

def delete_resume(user_id: str, resume_id: str) -> None:
    """
    Delete a resume row for the authenticated user.

    Cascade DELETE in the DB removes resume_sections and resume_chunks.
    user_skills rows have resume_id set to NULL (on delete set null).
    Raises 404 if not found or owned by another user.
    """
    _get_owned_resume(user_id, resume_id)

    run_supabase(
        "delete resume",
        lambda: (
            get_supabase_client()
            .table("resumes")
            .delete()
            .eq("id", resume_id)
            .eq("user_id", user_id)
            .execute()
        ),
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_owned_resume(user_id: str, resume_id: str) -> Resume:
    response = run_supabase(
        "get resume",
        lambda: (
            get_supabase_client()
            .table("resumes")
            .select("*")
            .eq("id", resume_id)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        ),
    )
    row = _row(response)
    if not row:
        raise _not_found()
    return Resume(**row)


def _mark_failed(supabase: Any, resume_id: str, user_id: str, error_message: str) -> None:
    """Best-effort: update the resume row to failed status."""
    try:
        supabase.table("resumes").update(
            {
                "status": ResumeStatus.FAILED.value,
                "error_message": error_message[:2000],
            }
        ).eq("id", resume_id).eq("user_id", user_id).execute()
    except Exception:
        pass
