"""Structured CV parsing with Gemini and safe local fallback hooks."""
from __future__ import annotations

import json
import logging
import re
from typing import Any, Optional

from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger(__name__)


class StructuredPersonalDetails(BaseModel):
    full_name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    website: str = ""
    linkedin: str = ""
    github: str = ""


class StructuredSkill(BaseModel):
    skill_name: str
    category: Optional[str] = None
    proficiency: Optional[str] = None


class StructuredExperience(BaseModel):
    role: str = ""
    company: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    is_current: bool = False
    description: str = ""
    highlights: list[str] = Field(default_factory=list)


class StructuredEducation(BaseModel):
    degree: str = ""
    institution: str = ""
    location: str = ""
    start_year: str = ""
    end_year: str = ""
    details: str = ""


class StructuredProject(BaseModel):
    name: str = ""
    description: str = ""
    technologies: str = ""
    link: str = ""
    highlights: list[str] = Field(default_factory=list)


class StructuredCertification(BaseModel):
    name: str = ""
    issuer: str = ""
    date: str = ""
    details: str = ""


class StructuredLanguage(BaseModel):
    name: str = ""
    proficiency: str = ""


class StructuredResumePayload(BaseModel):
    title: str = "Parsed CV"
    personal: StructuredPersonalDetails = Field(default_factory=StructuredPersonalDetails)
    summary: str = ""
    skills: list[StructuredSkill] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    experience: list[StructuredExperience] = Field(default_factory=list)
    education: list[StructuredEducation] = Field(default_factory=list)
    projects: list[StructuredProject] = Field(default_factory=list)
    certifications: list[StructuredCertification] = Field(default_factory=list)
    languages: list[StructuredLanguage] = Field(default_factory=list)


_STRUCTURED_PROMPT = """\
Analyze this CV text and extract editable structured CV data.
Return ONLY valid JSON in this exact shape:
{
  "title": "string",
  "personal": {
    "full_name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "website": "string",
    "linkedin": "string",
    "github": "string"
  },
  "summary": "string",
  "skills": [
    { "skill_name": "string", "category": "string", "proficiency": "string" }
  ],
  "tools": ["string"],
  "experience": [
    {
      "role": "string",
      "company": "string",
      "location": "string",
      "start_date": "string",
      "end_date": "string",
      "is_current": false,
      "description": "string",
      "highlights": ["string"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "location": "string",
      "start_year": "string",
      "end_year": "string",
      "details": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": "string",
      "link": "string",
      "highlights": ["string"]
    }
  ],
  "certifications": [
    { "name": "string", "issuer": "string", "date": "string", "details": "string" }
  ],
  "languages": [
    { "name": "string", "proficiency": "string" }
  ]
}

Rules:
- Extract only facts clearly present in the CV text.
- Do not invent companies, degrees, projects, skills, dates, links, or achievements.
- Keep dates as strings in the format found in the CV.
- Put frameworks, software, platforms, and developer tools in tools when they are not better represented as skills.
- Use empty strings or empty arrays for missing fields.
- No markdown, no commentary, JSON only.
"""


def parse_structured_resume(text: str) -> dict[str, Any] | None:
    """
    Parse extracted resume text into the manual CV payload shape.

    Returns None on any provider/validation failure so callers can safely fall
    back to heuristic section detection.
    """
    if not text.strip():
        return None

    try:
        raw = _generate_structured_json(text)
        payload = _coerce_payload(_extract_json_payload(raw))
        structured = StructuredResumePayload.model_validate(payload)
        return _normalize_payload(structured)
    except Exception as exc:  # pragma: no cover - fallback safety
        logger.warning("Structured Gemini CV parsing failed: %s", exc)
        return None


def _generate_structured_json(text: str) -> str:
    api_key = settings.gemini_api_key.strip()
    if not api_key or api_key.startswith("your-"):
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    try:
        import google.generativeai as genai  # noqa: PLC0415
    except ImportError as exc:
        raise RuntimeError("google-generativeai is not installed.") from exc

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")
    prompt = f"{_STRUCTURED_PROMPT}\n\nCV text:\n{text[:16000]}"
    response = model.generate_content(
        prompt,
        generation_config={"temperature": 0.1, "response_mime_type": "application/json"},
    )
    return (response.text or "").strip()


def _extract_json_payload(raw: str) -> dict[str, Any]:
    text = (raw or "").strip()
    if not text:
        raise ValueError("Gemini returned an empty structured CV response.")

    fence_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1).strip()

    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        obj_match = re.search(r"\{.*\}", text, re.DOTALL)
        if not obj_match:
            raise
        payload = json.loads(obj_match.group(0))

    if not isinstance(payload, dict):
        raise ValueError("Structured CV payload must be a JSON object.")
    return payload


def _coerce_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Accept close variants from Gemini/SkillSync-shaped responses."""
    coerced = dict(payload)

    if not isinstance(coerced.get("personal"), dict):
        coerced["personal"] = {}

    coerced["skills"] = [
        {"skill_name": item} if isinstance(item, str) else item
        for item in _as_list(coerced.get("skills"))
    ]
    coerced["tools"] = [
        item.get("name") if isinstance(item, dict) else item
        for item in _as_list(coerced.get("tools"))
    ]
    coerced["experience"] = [
        _coerce_experience(item)
        for item in _as_list(coerced.get("experience") or coerced.get("experiences"))
    ]
    coerced["education"] = [
        _coerce_education(item)
        for item in _as_list(coerced.get("education"))
    ]
    coerced["projects"] = [_coerce_project(item) for item in _as_list(coerced.get("projects"))]
    coerced["certifications"] = _as_list(coerced.get("certifications"))
    coerced["languages"] = [
        {"name": item, "proficiency": ""} if isinstance(item, str) else item
        for item in _as_list(coerced.get("languages"))
    ]
    return coerced


def _coerce_experience(item: Any) -> Any:
    if not isinstance(item, dict):
        return item
    coerced = dict(item)
    if "role" not in coerced and "title" in coerced:
        coerced["role"] = coerced.get("title")
    if "is_current" not in coerced and "current" in coerced:
        coerced["is_current"] = bool(coerced.get("current"))
    return coerced


def _coerce_education(item: Any) -> Any:
    if not isinstance(item, dict):
        return item
    coerced = dict(item)
    if "end_year" not in coerced and "graduation_year" in coerced:
        coerced["end_year"] = coerced.get("graduation_year")
    field = _clean(coerced.get("field"))
    details = _clean(coerced.get("details"))
    gpa = _clean(coerced.get("gpa"))
    if field or gpa:
        coerced["details"] = "; ".join(
            part
            for part in [
                details,
                f"Field: {field}" if field else "",
                f"GPA: {gpa}" if gpa else "",
            ]
            if part
        )
    return coerced


def _coerce_project(item: Any) -> Any:
    if not isinstance(item, dict):
        return item
    coerced = dict(item)
    technologies = coerced.get("technologies")
    if isinstance(technologies, list):
        coerced["technologies"] = ", ".join(
            _clean(value) for value in technologies if _clean(value)
        )
    return coerced


def _as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _normalize_payload(payload: StructuredResumePayload) -> dict[str, Any]:
    data = payload.model_dump()
    data["title"] = _clean(data.get("title")) or "Parsed CV"
    data["summary"] = _clean(data.get("summary"))
    data["personal"] = {
        key: _clean(value)
        for key, value in (data.get("personal") or {}).items()
    }
    data["skills"] = _dedupe_skills(data.get("skills") or [])
    data["tools"] = _dedupe_strings(data.get("tools") or [])
    data["experience"] = _clean_items(data.get("experience") or [])
    data["education"] = _clean_items(data.get("education") or [])
    data["projects"] = _clean_items(data.get("projects") or [])
    data["certifications"] = _clean_items(data.get("certifications") or [])
    data["languages"] = _clean_items(data.get("languages") or [])
    return data


def _dedupe_skills(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    normalized: list[dict[str, Any]] = []
    for item in items:
        name = _clean(item.get("skill_name"))
        key = name.lower()
        if not name or key in seen:
            continue
        seen.add(key)
        normalized.append(
            {
                "skill_name": name,
                "category": _clean(item.get("category")) or None,
                "proficiency": _clean(item.get("proficiency")) or None,
            }
        )
    return normalized


def _dedupe_strings(items: list[Any]) -> list[str]:
    seen: set[str] = set()
    normalized: list[str] = []
    for item in items:
        value = _clean(item)
        key = value.lower()
        if value and key not in seen:
            seen.add(key)
            normalized.append(value)
    return normalized


def _clean_items(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cleaned: list[dict[str, Any]] = []
    for item in items:
        next_item: dict[str, Any] = {}
        for key, value in item.items():
            if isinstance(value, list):
                next_item[key] = [_clean(entry) for entry in value if _clean(entry)]
            elif isinstance(value, bool):
                next_item[key] = value
            else:
                next_item[key] = _clean(value)
        if _has_any_value(next_item):
            cleaned.append(next_item)
    return cleaned


def _has_any_value(item: dict[str, Any]) -> bool:
    for value in item.values():
        if isinstance(value, list) and value:
            return True
        if isinstance(value, bool) and value:
            return True
        if not isinstance(value, (list, bool)) and _clean(value):
            return True
    return False


def _clean(value: Any) -> str:
    return str(value or "").strip()
