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
from app.cv_intelligence.services.chunker import chunk_sections
from app.cv_intelligence.services.embedding_service import embed_batch
from app.cv_intelligence.services.resume_parser import extract_text, validate_file
from app.cv_intelligence.services.section_detector import detect_sections
from app.cv_intelligence.services.skill_extractor import extract_skills


def _not_found(resource: str = "Resume") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} not found",
    )


# ---------------------------------------------------------------------------
# Read operations
# ---------------------------------------------------------------------------

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

def process_resume(user_id: str, filename: str, file_bytes: bytes) -> Resume:
    """
    Full CV ingestion pipeline:
      validate → insert row → extract text → detect sections → chunk
      → embed → insert chunks → extract skills → upsert skills
      → deactivate previous resumes → mark processed

    On any failure after the row is created, marks the row as failed and
    stores the error message before re-raising as HTTP 500.
    """
    supabase = get_supabase_client()
    file_type = Path(filename).suffix.lower().lstrip(".")

    # 1. Validate before touching the database
    validate_file(filename, len(file_bytes))

    # 2. Create resume row with status=processing
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
        # 3. Extract raw text
        raw_text = extract_text(filename, file_bytes)

        # 4. Detect sections
        sections = detect_sections(raw_text)

        # 5. Insert resume_sections and collect id mapping
        section_rows = [
            {
                "resume_id": resume_id,
                "user_id": user_id,
                "section_name": s["section_name"],
                "section_order": s["section_order"],
                "content": s["content"],
                "metadata": {},
            }
            for s in sections
        ]
        section_insert_resp = (
            supabase.table("resume_sections").insert(section_rows).execute()
        )
        inserted_sections = _rows(section_insert_resp)

        # Build name → id map (last write wins if duplicate names)
        section_id_map: dict[str, str] = {
            r["section_name"]: r["id"] for r in inserted_sections
        }

        # 6. Chunk all sections
        chunks = chunk_sections(sections)

        # 7. Generate embeddings in one batch
        chunk_texts = [c["chunk_text"] for c in chunks]
        embeddings = embed_batch(chunk_texts)

        # 8. Insert resume_chunks
        chunk_rows = [
            {
                "resume_id": resume_id,
                "user_id": user_id,
                "section_id": section_id_map.get(c["section_name"]),
                "section_name": c["section_name"],
                "chunk_index": c["chunk_index"],
                "chunk_text": c["chunk_text"],
                "token_count": c["token_count"],
                "embedding": embeddings[i],
                "metadata": {},
            }
            for i, c in enumerate(chunks)
        ]
        supabase.table("resume_chunks").insert(chunk_rows).execute()

        # 9. Extract skills
        skills = extract_skills(raw_text)

        # 10. Upsert user_skills (ignore duplicates by unique constraint)
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

        # 11. Deactivate all other resumes for this user
        (
            supabase.table("resumes")
            .update({"is_active": False})
            .eq("user_id", user_id)
            .neq("id", resume_id)
            .execute()
        )

        # 12. Mark as processed with raw_text and summary
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
                }
            )
            .eq("id", resume_id)
            .eq("user_id", user_id)
            .execute()
        )
        final = _row(update_resp)
        return Resume(**(final or created))

    except HTTPException:
        _mark_failed(supabase, resume_id, user_id, "Resume processing failed.")
        raise
    except Exception as exc:
        _mark_failed(supabase, resume_id, user_id, str(exc))
        raise_http_for_supabase(exc, context="process resume")


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
    _get_owned_resume(user_id, resume_id)  # ownership check / 404

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
        pass  # do not obscure the original error
