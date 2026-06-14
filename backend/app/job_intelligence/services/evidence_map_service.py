"""JD ↔ CV Evidence Map — map job requirements to RAG-retrieved CV evidence."""
from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from fastapi import HTTPException, status

from app.cv_intelligence.services.llm_service import _generate_text, _parse_json_response
from app.cv_intelligence.services.retrieval_service import search_chunks_batch
from app.cv_intelligence.services.skill_extractor import _extract_skills_deterministic
from app.job_intelligence.services._helpers import _row, _rows
from app.job_intelligence.services.job_scorer import _truncate_jd_text
from app.job_intelligence.services.job_service import (
    _list_user_skill_names,
    validate_resume_for_scoring,
)

logger = logging.getLogger(__name__)

_STRONG_THRESHOLD = 0.42
_WEAK_THRESHOLD = 0.18
_EVIDENCE_MIN_SIM = 0.12
_MAX_ROWS = 20
_MAX_EVIDENCE_PER_ROW = 2
_MAX_SNIPPET_CHARS = 400
_MAX_JD_PARSE_LINES = 10
_MAX_LLM_REQUIREMENTS = 12
_LLM_MIN_AB_ROWS = 8

RequirementCategory = Literal[
    "skill", "technical", "experience", "education", "soft_skill", "other"
]
RequirementStatus = Literal["strong", "weak", "missing"]
RequirementSource = Literal["skill_extraction", "jd_parse", "llm_extract"]

_BULLET_PATTERN = re.compile(r"^[\s]*[-•*]\s+(.+)$", re.MULTILINE)
_NUMBERED_PATTERN = re.compile(r"^[\s]*\d+[.)]\s+(.+)$", re.MULTILINE)
_KEYWORD_PATTERN = re.compile(
    r"[^.!?]*(?:required|must have|must|minimum|years of|experience with|"
    r"proficiency|preferred|qualification)[^.!?]*[.!?]?",
    re.IGNORECASE,
)

_SOURCE_PRIORITY: dict[RequirementSource, int] = {
    "skill_extraction": 0,
    "jd_parse": 1,
    "llm_extract": 2,
}


def _empty_summary() -> dict[str, Any]:
    return {
        "strong_count": 0,
        "weak_count": 0,
        "missing_count": 0,
        "total_requirements": 0,
        "coverage_percent": 0,
    }


def _normalize_label(label: str) -> str:
    cleaned = re.sub(r"[^\w\s+.#/-]", " ", label.lower())
    return re.sub(r"\s+", " ", cleaned).strip()


def _slugify(label: str, prefix: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")
    return f"{prefix}-{slug or uuid4().hex[:8]}"


def _infer_category(label: str, source: RequirementSource) -> RequirementCategory:
    if source == "skill_extraction":
        return "skill"
    lowered = label.lower()
    if any(k in lowered for k in ("year", "experience", "intern", "senior", "lead")):
        return "experience"
    if any(k in lowered for k in ("degree", "bachelor", "master", "education", "phd")):
        return "education"
    if any(
        k in lowered
        for k in ("communication", "leadership", "team", "collaboration", "mentor")
    ):
        return "soft_skill"
    if any(
        k in lowered
        for k in (
            "python",
            "java",
            "sql",
            "api",
            "cloud",
            "docker",
            "kubernetes",
            "react",
            "machine learning",
        )
    ):
        return "technical"
    return "other"


def _parse_jd_requirement_lines(jd_text: str) -> list[str]:
    """Extract candidate requirement lines from JD text (Source B)."""
    seen: set[str] = set()
    candidates: list[str] = []

    def add_candidate(raw: str) -> None:
        line = raw.strip()
        if len(line) < 20:
            return
        key = _normalize_label(line)
        if not key or key in seen:
            return
        seen.add(key)
        candidates.append(line)

    for match in _BULLET_PATTERN.finditer(jd_text):
        add_candidate(match.group(1))
    for match in _NUMBERED_PATTERN.finditer(jd_text):
        add_candidate(match.group(1))
    for match in _KEYWORD_PATTERN.finditer(jd_text):
        add_candidate(match.group(0))

    candidates.sort(key=len, reverse=True)
    return candidates[:_MAX_JD_PARSE_LINES]


def _extract_requirements_with_gemini(jd_text: str) -> list[dict[str, str]]:
    """Source C — structured JD requirements via Gemini (graceful fallback)."""
    prompt = (
        "Extract job requirements explicitly stated in this job description.\n"
        "Do not invent requirements. Return ONLY valid JSON:\n"
        "{\n"
        '  "requirements": [\n'
        '    {"label": "...", "category": "technical|experience|education|soft_skill|other"}\n'
        "  ]\n"
        "}\n"
        f"Maximum {_MAX_LLM_REQUIREMENTS} items.\n\n"
        f"Job description:\n{jd_text[:4000]}"
    )
    system = (
        "You extract requirements from job descriptions. "
        "Only include requirements explicitly mentioned in the text."
    )
    try:
        raw = _generate_text(prompt, system_prompt=system)
        parsed = _parse_json_response(raw)
        items = parsed.get("requirements") or []
        if not isinstance(items, list):
            return []
        results: list[dict[str, str]] = []
        for item in items[:_MAX_LLM_REQUIREMENTS]:
            if not isinstance(item, dict):
                continue
            label = str(item.get("label") or "").strip()
            if len(label) < 10:
                continue
            category = str(item.get("category") or "other").strip().lower()
            if category not in {
                "technical",
                "experience",
                "education",
                "soft_skill",
                "other",
            }:
                category = "other"
            results.append({"label": label, "category": category})
        return results
    except Exception as exc:
        logger.warning("Gemini requirement extraction failed, using A+B only: %s", exc)
        return []


def _format_evidence(chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    evidence: list[dict[str, Any]] = []
    for chunk in chunks[:_MAX_EVIDENCE_PER_ROW]:
        text = (chunk.get("chunk_text") or "").strip()
        if len(text) > _MAX_SNIPPET_CHARS:
            text = text[:_MAX_SNIPPET_CHARS].rstrip() + "…"
        evidence.append({
            "chunk_id": str(chunk.get("chunk_id") or ""),
            "section_name": chunk.get("section_name") or "CV section",
            "snippet": text,
            "similarity": round(float(chunk.get("similarity", 0)), 3),
        })
    return evidence


def _normalize_skill_key(label: str) -> str:
    return _normalize_label(label)


def _skill_matches_user(label: str, user_skill_set: set[str]) -> bool:
    """Exact normalized skill match — avoids loose substring false positives."""
    key = _normalize_skill_key(label)
    if not key:
        return False
    user_keys = {_normalize_skill_key(s) for s in user_skill_set if s}
    if key in user_keys:
        return True
    # Allow "next.js" vs "nextjs" style variants only when keys are long enough
    for user_key in user_keys:
        if len(key) >= 4 and len(user_key) >= 4 and (key in user_key or user_key in key):
            return True
    return False


def _resolve_status(
    *,
    label: str,
    user_skill_set: set[str],
    top_similarity: float,
    has_evidence: bool,
    fit_match: str = "neutral",
) -> tuple[RequirementStatus, bool]:
    in_user = _skill_matches_user(label, user_skill_set)

    if fit_match == "missing":
        # Fit scorer flagged this as a gap — do not mark strong without real evidence
        if in_user and top_similarity >= _STRONG_THRESHOLD and has_evidence:
            return "weak", True
        if has_evidence and top_similarity >= _WEAK_THRESHOLD:
            return "weak", False
        return "missing", False

    if fit_match == "matched" or in_user:
        if top_similarity >= _STRONG_THRESHOLD or (
            has_evidence and top_similarity >= _WEAK_THRESHOLD
        ):
            return "strong", True
        if has_evidence or top_similarity >= _WEAK_THRESHOLD:
            return "weak", True
        return "weak", True

    # JD parse / LLM / neutral skill rows — semantic evidence only
    if top_similarity >= _STRONG_THRESHOLD and has_evidence:
        return "strong", in_user
    if top_similarity >= _WEAK_THRESHOLD or (
        has_evidence and top_similarity >= _EVIDENCE_MIN_SIM
    ):
        return "weak", in_user
    return "missing", False


def _guidance_for_status(status: RequirementStatus, label: str) -> str | None:
    if status == "strong":
        return None
    if status == "weak":
        return (
            f"Partial evidence found for “{label}”. "
            "Consider strengthening this bullet with metrics or clearer keywords."
        )
    return (
        f"Consider adding evidence for “{label}” in your experience or projects section."
    )


def _build_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
    strong = sum(1 for r in rows if r["status"] == "strong")
    weak = sum(1 for r in rows if r["status"] == "weak")
    missing = sum(1 for r in rows if r["status"] == "missing")
    total = len(rows)
    return {
        "strong_count": strong,
        "weak_count": weak,
        "missing_count": missing,
        "total_requirements": total,
        "coverage_percent": round(strong / total * 100) if total else 0,
    }


def _collect_ab_candidates(
    *,
    jd_text: str,
    jd_skills: list[dict[str, Any]],
    jd_matched_skills: list[str] | None = None,
    jd_missing_skills: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Sources A + B — deterministic, no LLM."""
    candidates: list[dict[str, Any]] = []
    seen_labels: set[str] = set()

    def add_skill(name: str, fit_match: str = "neutral") -> None:
        key = _normalize_label(name)
        if not key or key in seen_labels:
            return
        seen_labels.add(key)
        candidates.append({
            "label": name,
            "category": "skill",
            "source": "skill_extraction",
            "is_skill_row": True,
            "fit_match": fit_match,
        })

    for skill_name in jd_matched_skills or []:
        if skill_name:
            add_skill(str(skill_name), "matched")

    for skill_name in jd_missing_skills or []:
        if skill_name:
            add_skill(str(skill_name), "missing")

    for skill in jd_skills:
        name = skill.get("skill_name") or ""
        if name:
            add_skill(name, "neutral")

    for line in _parse_jd_requirement_lines(jd_text):
        key = _normalize_label(line)
        if not key or key in seen_labels:
            continue
        seen_labels.add(key)
        candidates.append({
            "label": line,
            "category": _infer_category(line, "jd_parse"),
            "source": "jd_parse",
            "is_skill_row": False,
            "fit_match": "neutral",
        })

    return candidates


def _collect_candidate_rows(
    *,
    jd_text: str,
    jd_skills: list[dict[str, Any]],
    jd_matched_skills: list[str] | None = None,
    jd_missing_skills: list[str] | None = None,
) -> list[dict[str, Any]]:
    candidates = _collect_ab_candidates(
        jd_text=jd_text,
        jd_skills=jd_skills,
        jd_matched_skills=jd_matched_skills,
        jd_missing_skills=jd_missing_skills,
    )
    ab_deduped = _dedupe_and_cap_candidates(candidates)

    if len(ab_deduped) >= _LLM_MIN_AB_ROWS:
        return ab_deduped

    for item in _safe_llm_requirements(jd_text):
        candidates.append({
            "label": item["label"],
            "category": item.get("category") or "other",
            "source": "llm_extract",
            "is_skill_row": False,
            "fit_match": "neutral",
        })

    return _dedupe_and_cap_candidates(candidates)


def _safe_llm_requirements(jd_text: str) -> list[dict[str, str]]:
    try:
        return _extract_requirements_with_gemini(jd_text)
    except Exception as exc:
        logger.warning("LLM requirement extraction skipped: %s", exc)
        return []


_FIT_MATCH_PRIORITY = {"matched": 0, "neutral": 1, "missing": 2}


def _dedupe_and_cap_candidates(candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_key: dict[str, dict[str, Any]] = {}
    for candidate in candidates:
        key = _normalize_label(candidate["label"])
        if not key:
            continue
        existing = by_key.get(key)
        if existing is None:
            if _is_redundant_with_existing_skill(key, by_key):
                continue
            by_key[key] = candidate
            continue
        # Prefer matched > neutral > missing, then source priority
        cand_fit = _FIT_MATCH_PRIORITY.get(candidate.get("fit_match", "neutral"), 1)
        exist_fit = _FIT_MATCH_PRIORITY.get(existing.get("fit_match", "neutral"), 1)
        if cand_fit < exist_fit:
            by_key[key] = candidate
        elif cand_fit == exist_fit and _SOURCE_PRIORITY[candidate["source"]] < _SOURCE_PRIORITY[existing["source"]]:
            by_key[key] = candidate

    # Collapse overlapping labels (e.g. "python" vs "python experience is required")
    collapsed: dict[str, dict[str, Any]] = {}
    for key, candidate in sorted(
        by_key.items(),
        key=lambda item: (_SOURCE_PRIORITY[item[1]["source"]], len(item[0])),
    ):
        overlap_key = _find_overlapping_key(key, collapsed)
        if overlap_key is not None:
            existing = collapsed[overlap_key]
            if _SOURCE_PRIORITY[candidate["source"]] < _SOURCE_PRIORITY[existing["source"]]:
                del collapsed[overlap_key]
                collapsed[key] = candidate
            continue
        collapsed[key] = candidate

    ordered = sorted(
        collapsed.values(),
        key=lambda c: (
            _SOURCE_PRIORITY[c["source"]],
            -len(c["label"]),
        ),
    )
    return ordered[:_MAX_ROWS]


def _is_redundant_with_existing_skill(key: str, existing: dict[str, dict[str, Any]]) -> bool:
    for existing_key, row in existing.items():
        if row["source"] != "skill_extraction":
            continue
        if existing_key in key or key in existing_key:
            return True
    return False


def _find_overlapping_key(key: str, existing: dict[str, dict[str, Any]]) -> str | None:
    for existing_key in existing:
        if key == existing_key:
            return existing_key
        if len(key) >= 8 and len(existing_key) >= 8 and (
            key in existing_key or existing_key in key
        ):
            return existing_key
    return None


def build_evidence_map(
    *,
    user_id: str,
    match_id: str,
    supabase: Any,
) -> dict[str, Any]:
    """Build an on-demand JD ↔ CV evidence map for a job match."""
    response = (
        supabase.table("job_matches")
        .select(
            "id, job_id, resume_id, fit_score, matched_skills, missing_skills, jobs(*)"
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
    resume_id = row.get("resume_id")
    if not resume_id:
        return {
            "match_id": match_id,
            "job": _minimal_job(job),
            "fit_score": float(row.get("fit_score") or 0),
            "summary": _empty_summary(),
            "rows": [],
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "empty_reason": "no_processed_resume",
        }

    try:
        validate_resume_for_scoring(
            user_id=user_id,
            resume_id=str(resume_id),
            supabase=supabase,
        )
    except ValueError:
        return {
            "match_id": match_id,
            "job": _minimal_job(job),
            "fit_score": float(row.get("fit_score") or 0),
            "summary": _empty_summary(),
            "rows": [],
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "empty_reason": "no_processed_resume",
        }

    jd_text = _truncate_jd_text(
        job.get("title") or "",
        job.get("description"),
        job.get("requirements"),
    )
    if not jd_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Job description is empty; cannot build evidence map.",
        )

    user_skill_names = _list_user_skill_names(user_id=user_id, supabase=supabase)
    user_skill_set = set(user_skill_names)
    jd_skills = _extract_skills_deterministic(jd_text)

    jd_matched_skills = list(row.get("matched_skills") or [])
    jd_missing_skills = list(row.get("missing_skills") or [])

    candidates = _collect_candidate_rows(
        jd_text=jd_text,
        jd_skills=jd_skills,
        jd_matched_skills=jd_matched_skills,
        jd_missing_skills=jd_missing_skills,
    )

    labels = [candidate["label"] for candidate in candidates]
    chunk_results = search_chunks_batch(
        user_id=user_id,
        queries=labels,
        supabase=supabase,
        resume_id=str(resume_id),
        top_k=_MAX_EVIDENCE_PER_ROW,
    )

    rows: list[dict[str, Any]] = []
    for candidate, chunks in zip(candidates, chunk_results, strict=True):
        label = candidate["label"]
        qualifying = [
            c for c in chunks if float(c.get("similarity", 0)) >= _EVIDENCE_MIN_SIM
        ]
        top_similarity = max(
            (float(c.get("similarity", 0)) for c in qualifying),
            default=0.0,
        )
        has_evidence = len(qualifying) > 0
        status_value, matched_skill = _resolve_status(
            label=label,
            user_skill_set=user_skill_set,
            top_similarity=top_similarity,
            has_evidence=has_evidence,
            fit_match=str(candidate.get("fit_match") or "neutral"),
        )
        source: RequirementSource = candidate["source"]
        prefix = "skill" if source == "skill_extraction" else "req"
        rows.append({
            "id": _slugify(label, prefix),
            "label": label,
            "category": candidate["category"],
            "status": status_value,
            "source": source,
            "matched_skill": matched_skill,
            "top_similarity": round(float(top_similarity), 3),
            "evidence_chunks": _format_evidence(qualifying),
            "guidance": _guidance_for_status(status_value, label),
        })

    logger.info(
        "Evidence map built match_id=%s rows=%s batch_retrievals=%s",
        match_id,
        len(rows),
        len(labels),
    )

    return {
        "match_id": match_id,
        "job": _minimal_job(job),
        "fit_score": float(row.get("fit_score") or 0),
        "summary": _build_summary(rows),
        "rows": rows,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "empty_reason": None if rows else "no_requirements_detected",
    }


def _minimal_job(job: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(job.get("id") or ""),
        "title": job.get("title") or "",
        "company": job.get("company"),
        "location": job.get("location"),
        "description": job.get("description"),
        "requirements": job.get("requirements"),
    }
