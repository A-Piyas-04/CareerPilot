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
from app.cv_intelligence.services.skill_extractor import _extract_skills_deterministic

_SKILLS_WEIGHT: float = 0.6
_SIMILARITY_WEIGHT: float = 0.4
_TOP_K_CHUNKS: int = 5
_MAX_JD_CHARS: int = 2000
_SNIPPET_MAX_CHARS: int = 280


def _truncate_jd_text(title: str, description: str | None, requirements: str | None) -> str:
    jd_text_parts = [title or "", description or "", requirements or ""]
    jd_text = "\n".join(part for part in jd_text_parts if part).strip()
    if len(jd_text) <= _MAX_JD_CHARS:
        return jd_text
    return jd_text[:_MAX_JD_CHARS].rstrip()


def _similarity_tier(mean_sim: float) -> str:
    if mean_sim >= 0.55:
        return "Your CV content aligns well with this posting."
    if mean_sim >= 0.35:
        return "Your CV content moderately aligns with this posting."
    if mean_sim > 0:
        return "Your CV content weakly aligns with this posting."
    return "No strong CV section overlap was detected for this posting."


def _build_explanation(
    *,
    matched: list[str],
    missing: list[str],
    jd_skill_count: int,
    mean_sim: float,
) -> str:
    tier = _similarity_tier(mean_sim)
    parts: list[str] = [tier]

    if jd_skill_count:
        parts.append(f"Matched {len(matched)}/{jd_skill_count} required skills.")
        if matched:
            preview = ", ".join(matched[:3])
            suffix = "…" if len(matched) > 3 else ""
            parts.append(f"You have: {preview}{suffix}.")
        if missing:
            gap_preview = ", ".join(missing[:3])
            gap_suffix = "…" if len(missing) > 3 else ""
            parts.append(f"Gaps: {gap_preview}{gap_suffix}.")
    else:
        parts.append("Score is based on resume-chunk similarity (no JD skills detected).")

    return " ".join(parts)


def _format_evidence_chunks(chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    evidence: list[dict[str, Any]] = []
    for chunk in chunks[:_TOP_K_CHUNKS]:
        text = (chunk.get("chunk_text") or "").strip()
        if len(text) > _SNIPPET_MAX_CHARS:
            text = text[:_SNIPPET_MAX_CHARS].rstrip() + "…"
        evidence.append({
            "chunk_id": chunk.get("chunk_id"),
            "section_name": chunk.get("section_name") or "CV section",
            "snippet": text,
            "similarity": round(float(chunk.get("similarity", 0)), 3),
        })
    return evidence


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
    jd_text = _truncate_jd_text(title, description, requirements)

    jd_skill_names = {s["skill_name"] for s in _extract_skills_deterministic(jd_text)}
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

    explanation = _build_explanation(
        matched=matched,
        missing=missing,
        jd_skill_count=len(jd_skill_names),
        mean_sim=mean_sim,
    )

    evidence_chunks = _format_evidence_chunks(chunks)

    return {
        "fit_score": fit_score,
        "matched_skills": matched,
        "missing_skills": missing,
        "explanation": explanation,
        "evidence_chunk_ids": [c["chunk_id"] for c in chunks if c.get("chunk_id")],
        "evidence_chunks": evidence_chunks,
        "skills_component": round(skills_component, 3),
        "mean_similarity": round(mean_sim, 3),
    }
