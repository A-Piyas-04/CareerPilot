"""LLM-grounded CV answer and career content generation using Google Gemini.

The system prompt strictly grounds the answer in retrieved CV chunks so the
model cannot hallucinate background that isn't in the user's resume.

Model cascade (quota exhaustion triggers the next model in sequence):
  gemini-2.5-pro → gemini-2.5-flash → gemini-2.0-flash → gemini-1.5-flash → graceful message

If GEMINI_API_KEY is not set or the google-generativeai package is missing,
returns a graceful fallback message rather than crashing the endpoint.
"""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are CareerPilot, an AI career assistant. You have been given excerpts from
the user's CV (resume). Your job is to answer the user's question using ONLY
the information present in those excerpts.

Rules:
- Never invent work experience, skills, education, or achievements not found in
  the excerpts.
- If the answer is not in the excerpts, say so honestly: "I couldn't find that
  in your CV."
- Be concise, professional, and helpful.
- Refer to the user in the second person ("you", "your").
"""

_NO_KEY_MSG = (
    "AI answers are not configured yet. "
    "Set GEMINI_API_KEY in your environment to enable this feature."
)

_NO_CHUNKS_MSG = (
    "No relevant sections were found in your CV for that question. "
    "Try rephrasing or upload a more detailed resume."
)

# Ordered cascade — tried left to right; moves to next on quota exhaustion.
_MODEL_CASCADE: list[str] = [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]

_MAX_CHUNK_CHARS = 600   # per chunk — keeps prompts within context limits
_MAX_TOTAL_CHARS = 6000  # hard cap on total context passed to Gemini


def _is_quota_error(exc: Exception) -> bool:
    """Return True when the exception signals a rate-limit / quota exhaustion."""
    name = type(exc).__name__
    msg  = str(exc).lower()
    return (
        "ResourceExhausted" in name
        or "429" in msg
        or "quota" in msg
        or "rate" in msg
        or "exhausted" in msg
    )


def _call_model(genai: Any, model_name: str, prompt: str) -> str:
    """Call a single Gemini model and return the response text."""
    model    = genai.GenerativeModel(model_name)
    response = model.generate_content(prompt)
    return response.text.strip()


def _build_context_from_chunks(chunks: list[dict[str, Any]]) -> str:
    from app.cv_intelligence.services.rag_context_service import (  # noqa: PLC0415
        format_chunks_as_context,
    )

    return format_chunks_as_context(chunks)


def _get_genai_client() -> Any | None:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key.startswith("your-"):
        return None
    try:
        import google.generativeai as genai  # noqa: PLC0415
    except ImportError:
        return None
    genai.configure(api_key=api_key)
    return genai


def _generate_text(prompt: str) -> str:
    genai = _get_genai_client()
    if genai is None:
        return _NO_KEY_MSG
    for idx, model_name in enumerate(_MODEL_CASCADE):
        is_last = idx == len(_MODEL_CASCADE) - 1
        try:
            result = _call_model(genai, model_name, prompt)
            logger.info("Gemini generated via %s", model_name)
            return result
        except Exception as exc:
            if _is_quota_error(exc) and not is_last:
                continue
            logger.exception("Gemini %s generation failed: %s", model_name, exc)
            return "AI generation unavailable at the moment. Please try again later."
    return "AI generation unavailable at the moment. Please try again later."


def _parse_json_response(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned)
    if fence:
        cleaned = fence.group(1).strip()
    return json.loads(cleaned)


def answer_from_chunks(question: str, chunks: list[dict[str, Any]]) -> str:
    """
    Build a prompt from retrieved CV chunks and ask Gemini to answer the
    question. Walks _MODEL_CASCADE left-to-right; moves to the next model
    on quota exhaustion. Returns a plain-text answer string.
    """
    if not chunks:
        return _NO_CHUNKS_MSG

    context = _build_context_from_chunks(chunks)
    full_prompt = (
        f"{_SYSTEM_PROMPT}\n\n"
        f"CV Excerpts:\n\n{context}\n\nQuestion: {question}"
    )
    return _generate_text(full_prompt)


def generate_cover_letter(
    *,
    job_description: str,
    chunks: list[dict[str, Any]],
    target_role: str | None = None,
    company_name: str | None = None,
) -> str:
    if not chunks:
        return _NO_CHUNKS_MSG

    context = _build_context_from_chunks(chunks)
    role = target_role or "[Role Title]"
    company = company_name or "[Company Name]"
    prompt = (
        f"{_SYSTEM_PROMPT}\n\n"
        f"CV Excerpts:\n\n{context}\n\n"
        f"Target role: {role}\n"
        f"Company: {company}\n\n"
        f"Job description:\n{job_description.strip() or 'Not provided.'}\n\n"
        "Write a professional cover letter (250-350 words). "
        "Reference only experience and skills from the CV excerpts. "
        "Do not invent employers, projects, or tools not in the excerpts."
    )
    return _generate_text(prompt)


def analyze_skill_gap(
    *,
    target_role: str,
    job_description: str,
    chunks: list[dict[str, Any]],
    user_skills: list[str],
    jd_skills: list[str],
) -> dict[str, Any]:
    if not chunks and not user_skills:
        return {
            "current_skills": [],
            "required_skills": jd_skills,
            "missing_skills": jd_skills,
            "recommendations": {
                "summary": _NO_CHUNKS_MSG,
                "next_steps": [],
                "evidence_chunk_ids": [],
            },
        }

    context = _build_context_from_chunks(chunks)
    prompt = (
        f"{_SYSTEM_PROMPT}\n\n"
        f"CV Excerpts:\n\n{context or 'No excerpts.'}\n\n"
        f"Extracted CV skills: {', '.join(user_skills) or 'none'}\n"
        f"JD/role skills detected: {', '.join(jd_skills) or 'none'}\n"
        f"Target role: {target_role}\n"
        f"Job description:\n{job_description.strip() or 'Not provided.'}\n\n"
        "Return ONLY valid JSON with this shape:\n"
        "{\n"
        '  "current_skills": ["..."],\n'
        '  "required_skills": ["..."],\n'
        '  "missing_skills": ["..."],\n'
        '  "recommendations": {\n'
        '    "summary": "...",\n'
        '    "next_steps": ["..."],\n'
        '    "evidence_snippets": [{"skill": "...", "section": "...", "quote": "..."}]\n'
        "  }\n"
        "}\n"
        "Rules: current_skills must be supported by CV excerpts or extracted skills. "
        "Do not list skills as current unless evidenced."
    )
    raw = _generate_text(prompt)
    try:
        parsed = _parse_json_response(raw)
    except (json.JSONDecodeError, TypeError):
        matched = sorted(set(user_skills) & set(jd_skills))
        missing = sorted(set(jd_skills) - set(user_skills))
        return {
            "current_skills": matched or list(user_skills),
            "required_skills": list(jd_skills),
            "missing_skills": missing,
            "recommendations": {"summary": raw, "next_steps": [], "evidence_snippets": []},
        }
    return parsed


def generate_roadmap(
    *,
    target_role: str,
    chunks: list[dict[str, Any]],
    user_skills: list[str],
    missing_skills: list[str],
    duration_weeks: int = 8,
) -> dict[str, Any]:
    context = _build_context_from_chunks(chunks)
    prompt = (
        f"{_SYSTEM_PROMPT}\n\n"
        f"CV Excerpts:\n\n{context or 'No excerpts.'}\n\n"
        f"Current skills: {', '.join(user_skills) or 'none'}\n"
        f"Skill gaps to address: {', '.join(missing_skills) or 'none'}\n"
        f"Target role: {target_role}\n"
        f"Duration: {duration_weeks} weeks\n\n"
        "Return ONLY valid JSON:\n"
        "{\n"
        '  "overview": "...",\n'
        '  "items": [\n'
        '    {"week_number": 1, "title": "...", "description": "...", "resources": ["..."]}\n'
        "  ]\n"
        "}\n"
        f"Provide exactly {duration_weeks} weekly items. "
        "Base the plan only on the user's actual CV background; do not invent experience."
    )
    raw = _generate_text(prompt)
    try:
        return _parse_json_response(raw)
    except (json.JSONDecodeError, TypeError):
        return {
            "overview": raw,
            "items": [
                {
                    "week_number": week,
                    "title": f"Week {week}",
                    "description": "Continue building skills toward the target role.",
                    "resources": [],
                }
                for week in range(1, duration_weeks + 1)
            ],
        }
