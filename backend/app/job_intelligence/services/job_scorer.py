"""Deterministic job-to-resume fit scoring.

fit_score = 0.6 * skills_overlap_ratio + 0.4 * mean_chunk_similarity

where
    skills_overlap_ratio = |jd_skills ∩ user_skills| / |jd_skills|
                           (0.0 if jd_skills is empty)
    mean_chunk_similarity = average similarity of top-k resume chunks
                            retrieved for the JD text (0.0 if no chunks).

Returns a dict with the score (0-100, 2dp) and supporting fields.
"""
from __future__ import annotations

from typing import Any

from app.cv_intelligence.services.retrieval_service import search_chunks
from app.cv_intelligence.services.skill_extractor import extract_skills

_SKILLS_WEIGHT: float = 0.6
_SIMILARITY_WEIGHT: float = 0.4
_TOP_K_CHUNKS: int = 5


def score_job(
    *,
    user_id: str,
    resume_id: str,
    user_skill_names: list[str],
    title: str,
    description: str | None,
    requirements: str | None,
    supabase: Any,
) -> dict[str, Any]:
    jd_text_parts = [title or "", description or "", requirements or ""]
    jd_text = "\n".join(part for part in jd_text_parts if part).strip()

    jd_skill_names = {s["skill_name"] for s in extract_skills(jd_text)}
    user_skill_set = {name for name in user_skill_names if name}

    matched = sorted(jd_skill_names & user_skill_set)
    missing = sorted(jd_skill_names - user_skill_set)

    if jd_skill_names:
        skills_component = len(matched) / len(jd_skill_names)
    else:
        skills_component = 0.0

    chunks = search_chunks(
        user_id=user_id,
        query=jd_text or title,
        supabase=supabase,
        resume_id=resume_id,
        top_k=_TOP_K_CHUNKS,
    )
    if chunks:
        mean_sim = sum(c["similarity"] for c in chunks) / len(chunks)
    else:
        mean_sim = 0.0

    raw_score = _SKILLS_WEIGHT * skills_component + _SIMILARITY_WEIGHT * mean_sim
    fit_score = round(raw_score * 100.0, 2)

    if not jd_skill_names:
        explanation = (
            "No recognizable skills found in this JD; score is based on "
            "resume-chunk similarity only."
        )
    else:
        explanation = (
            f"Matched {len(matched)}/{len(jd_skill_names)} JD skills. "
            f"Mean resume-chunk similarity: {round(mean_sim, 3)}."
        )

    return {
        "fit_score": fit_score,
        "matched_skills": matched,
        "missing_skills": missing,
        "explanation": explanation,
        "evidence_chunk_ids": [c["chunk_id"] for c in chunks],
    }
