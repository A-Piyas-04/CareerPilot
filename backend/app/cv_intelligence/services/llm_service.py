"""LLM-grounded CV answer and career content generation using Google Gemini REST API.

The system prompt strictly grounds the answer in retrieved CV chunks so the
model cannot hallucinate background that isn't in the user's resume.

Uses the Generative Language API (same as the Next.js frontend) with a model
cascade, optional model discovery, and extractive fallback when quota is out.

If GEMINI_API_KEY is not set, returns a graceful fallback message rather than
crashing the endpoint.
"""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

import httpx

from app.core.config import get_settings

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
    "Set GEMINI_API_KEY in backend/.env (Docker backend does not read frontend/.env alone)."
)

_NO_CHUNKS_MSG = (
    "No relevant sections were found in your CV for that question. "
    "Try rephrasing or upload a more detailed resume."
)

_UNAVAILABLE_MSG = (
    "AI generation unavailable at the moment. Please try again later."
)

_DEFAULT_MODEL_CASCADE: list[str] = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]

_GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
_MODEL_PREFIX = "models/"


def _normalize_model_name(model: str) -> str:
    clean = model.strip()
    if clean.startswith(_MODEL_PREFIX):
        return clean[len(_MODEL_PREFIX) :]
    return clean


def _dedupe_models(models: list[str]) -> list[str]:
    seen: set[str] = set()
    deduped: list[str] = []
    for model in models:
        clean = _normalize_model_name(model)
        if not clean or clean in seen:
            continue
        seen.add(clean)
        deduped.append(clean)
    return deduped


def _model_cascade() -> list[str]:
    preferred = os.getenv("GEMINI_MODEL", "").strip()
    configured = os.getenv("GEMINI_GENERATION_FALLBACK_MODELS", "").strip()
    fallbacks = [
        _normalize_model_name(part)
        for part in configured.split(",")
        if part.strip()
    ]
    if preferred:
        return _dedupe_models([preferred, *fallbacks, *_DEFAULT_MODEL_CASCADE])
    return _dedupe_models([*fallbacks, *_DEFAULT_MODEL_CASCADE])


def _api_key() -> str:
    key = get_settings().gemini_api_key.strip() or os.getenv("GEMINI_API_KEY", "").strip()
    if not key or key.startswith("your-"):
        return ""
    return key


def _is_quota_error_message(message: str) -> bool:
    normalized = message.lower()
    return (
        "resourceexhausted" in normalized
        or "429" in normalized
        or "quota" in normalized
        or "rate limit" in normalized
        or "exhausted" in normalized
    )


def _is_model_unavailable_message(message: str, status: int) -> bool:
    normalized = message.lower()
    is_model = "model" in normalized and (
        "not found" in normalized
        or "not supported" in normalized
        or "unsupported" in normalized
        or "unavailable" in normalized
    )
    return is_model and status in {400, 404}


def _is_retryable_error(status: int, message: str) -> bool:
    if status == 429 or _is_quota_error_message(message):
        return True
    return _is_model_unavailable_message(message, status)


def _user_message_for_failure(message: str, status: int) -> str:
    normalized = message.lower()
    if not _api_key():
        return _NO_KEY_MSG
    if _is_quota_error_message(message) or status == 429:
        if "limit: 0" in normalized:
            return (
                "Your Gemini API key has no free-tier generation quota left "
                "(limit: 0). Create a new key at https://aistudio.google.com/apikey, "
                "check usage at https://ai.dev/rate-limit, or enable billing on "
                "your Google Cloud project. The key must be set in backend/.env for "
                "resume Q&A (Ask AI uses the Python backend)."
            )
        retry = re.search(r"retry in (\d+(?:\.\d+)?)s", normalized)
        if retry:
            seconds = max(1, int(float(retry.group(1))))
            return (
                f"Gemini rate limit reached. Wait about {seconds} seconds and try again, "
                "or check https://ai.dev/rate-limit."
            )
        return (
            "Gemini API quota or rate limit exceeded. Wait a minute and try again, "
            "or check https://ai.dev/rate-limit."
        )
    if _is_model_unavailable_message(message, status):
        return (
            "No supported Gemini model is available for this API key. "
            "Set GEMINI_MODEL in backend/.env to a model listed in Google AI Studio."
        )
    return _UNAVAILABLE_MSG


def _list_generate_content_models(client: httpx.Client, api_key: str) -> list[str]:
    try:
        response = client.get(
            f"{_GEMINI_API_BASE}/models",
            headers={"x-goog-api-key": api_key},
            timeout=20.0,
        )
        if response.status_code != 200:
            return []
        data = response.json()
        models = data.get("models") or []
        names: list[str] = []
        for item in models:
            if "generateContent" not in (item.get("supportedGenerationMethods") or []):
                continue
            name = item.get("name") or ""
            if name:
                names.append(name)
        return _dedupe_models(names)
    except Exception as exc:
        logger.warning("Could not list Gemini models: %s", exc)
        return []


def _extract_response_text(data: dict[str, Any]) -> str:
    candidates = data.get("candidates") or []
    if not candidates:
        return ""
    parts = candidates[0].get("content", {}).get("parts") or []
    return "".join(part.get("text", "") for part in parts).strip()


def _generate_text_rest(api_key: str, prompt: str, *, system_prompt: str | None = None) -> str:
    body: dict[str, Any] = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4},
    }
    if system_prompt:
        body["systemInstruction"] = {"parts": [{"text": system_prompt}]}

    model_queue = _model_cascade()
    last_status = 500
    last_message = _UNAVAILABLE_MSG
    tried_discovered = False

    with httpx.Client(timeout=90.0) as client:
        index = 0
        while index < len(model_queue):
            model = model_queue[index]
            is_last = index >= len(model_queue) - 1
            url = f"{_GEMINI_API_BASE}/models/{model}:generateContent"
            try:
                response = client.post(
                    url,
                    headers={
                        "Content-Type": "application/json",
                        "x-goog-api-key": api_key,
                    },
                    json=body,
                )
            except httpx.HTTPError as exc:
                logger.exception("Gemini HTTP error for %s: %s", model, exc)
                return _UNAVAILABLE_MSG

            if response.status_code == 200:
                text = _extract_response_text(response.json())
                if text:
                    logger.info("Gemini generated via %s (REST)", model)
                    return text
                last_message = "Gemini returned an empty response."
                last_status = 200
            else:
                try:
                    payload = response.json()
                    last_message = (
                        payload.get("error", {}).get("message")
                        or response.text
                        or _UNAVAILABLE_MSG
                    )
                except json.JSONDecodeError:
                    last_message = response.text or _UNAVAILABLE_MSG
                last_status = response.status_code
                logger.warning(
                    "Gemini %s failed (%s): %s",
                    model,
                    response.status_code,
                    last_message,
                )

            if (
                is_last
                and not tried_discovered
                and _is_model_unavailable_message(last_message, last_status)
            ):
                tried_discovered = True
                discovered = _list_generate_content_models(client, api_key)
                expanded = _dedupe_models([*model_queue, *discovered])
                if len(expanded) > len(model_queue):
                    model_queue = expanded
                    continue

            if not is_last and _is_retryable_error(last_status, last_message):
                index += 1
                continue

            return _user_message_for_failure(last_message, last_status)

    return _user_message_for_failure(last_message, last_status)


def _build_context_from_chunks(chunks: list[dict[str, Any]]) -> str:
    from app.cv_intelligence.services.rag_context_service import (  # noqa: PLC0415
        format_chunks_as_context,
    )

    return format_chunks_as_context(chunks)


def _extractive_fallback_answer(question: str, chunks: list[dict[str, Any]]) -> str:
    """When Gemini is unavailable, return retrieved CV excerpts with guidance."""
    context = _build_context_from_chunks(chunks)
    intro = (
        "Gemini could not generate an AI answer (usually API quota or rate limits). "
        "Below are the most relevant sections from your CV for this question. "
        "Create a new API key at https://aistudio.google.com/apikey or check "
        "https://ai.dev/rate-limit, then set GEMINI_API_KEY in backend/.env.\n\n"
    )
    return f"{intro}**Your question:** {question}\n\n**From your CV:**\n\n{context}"


def _generate_text(prompt: str, *, system_prompt: str | None = None) -> str:
    api_key = _api_key()
    if not api_key:
        return _NO_KEY_MSG
    return _generate_text_rest(api_key, prompt, system_prompt=system_prompt)


def _should_use_extractive_fallback(answer: str) -> bool:
    if answer == _UNAVAILABLE_MSG:
        return True
    lowered = answer.lower()
    return (
        "quota" in lowered
        or "rate limit" in lowered
        or "limit: 0" in lowered
        or (
            "not configured" in lowered and "gemini_api_key" in lowered
        )
    )


def _parse_json_response(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned)
    if fence:
        cleaned = fence.group(1).strip()
    return json.loads(cleaned)


def answer_from_chunks(question: str, chunks: list[dict[str, Any]]) -> str:
    """
    Build a prompt from retrieved CV chunks and ask Gemini to answer the
    question. Falls back to excerpt-only output when Gemini quota is exhausted.
    """
    if not chunks:
        return _NO_CHUNKS_MSG

    context = _build_context_from_chunks(chunks)
    user_prompt = f"CV Excerpts:\n\n{context}\n\nQuestion: {question}"
    answer = _generate_text(user_prompt, system_prompt=_SYSTEM_PROMPT)
    if _should_use_extractive_fallback(answer):
        return _extractive_fallback_answer(question, chunks)
    return answer


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
        f"CV Excerpts:\n\n{context}\n\n"
        f"Target role: {role}\n"
        f"Company: {company}\n\n"
        f"Job description:\n{job_description.strip() or 'Not provided.'}\n\n"
        "Write a professional cover letter (250-350 words). "
        "Reference only experience and skills from the CV excerpts. "
        "Do not invent employers, projects, or tools not in the excerpts."
    )
    return _generate_text(prompt, system_prompt=_SYSTEM_PROMPT)


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
    raw = _generate_text(prompt, system_prompt=_SYSTEM_PROMPT)
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
    raw = _generate_text(prompt, system_prompt=_SYSTEM_PROMPT)
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
