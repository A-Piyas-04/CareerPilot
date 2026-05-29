"""Gemini provider for resume skill extraction."""
from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

_PROMPT = """\
Extract technical skills from the resume text below.
Return ONLY valid JSON in this exact shape:
{
  "skills": [
    {
      "skill_name": "string",
      "category": "string",
      "evidence": "short quote from resume"
    }
  ]
}

Rules:
- Include only skills clearly present in the text.
- Keep skill_name concise and canonical (e.g., "Python", "Docker", "PostgreSQL").
- Keep evidence brief and grounded in the provided resume text.
- No markdown, no commentary, JSON only.
"""


class GeminiResumeAnalysisProvider:
    """Extract resume skills using Gemini."""

    def __init__(self) -> None:
        self._api_key = settings.gemini_api_key.strip()
        self._genai: Any = None
        self._model_name = "gemini-2.0-flash"

    def _get_client(self) -> Any:
        if not self._api_key or self._api_key.startswith("your-"):
            raise RuntimeError(
                "GEMINI_API_KEY is not configured. "
                "Set GEMINI_API_KEY to enable Gemini resume analysis."
            )
        if self._genai is None:
            try:
                import google.generativeai as genai  # noqa: PLC0415
            except ImportError as exc:
                raise RuntimeError(
                    "google-generativeai is not installed. "
                    "Run: pip install google-generativeai"
                ) from exc
            genai.configure(api_key=self._api_key)
            self._genai = genai
        return self._genai

    def _extract_json_payload(self, raw: str) -> dict[str, Any]:
        text = (raw or "").strip()
        if not text:
            return {}

        # Strip markdown fences when present.
        fence_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
        if fence_match:
            text = fence_match.group(1).strip()

        try:
            payload = json.loads(text)
            if isinstance(payload, dict):
                return payload
        except json.JSONDecodeError:
            pass

        # Fallback: extract first JSON object from noisy text.
        obj_match = re.search(r"\{.*\}", text, re.DOTALL)
        if obj_match:
            try:
                payload = json.loads(obj_match.group(0))
                if isinstance(payload, dict):
                    return payload
            except json.JSONDecodeError:
                return {}
        return {}

    def _normalize(self, payload: dict[str, Any]) -> list[dict]:
        raw_skills = payload.get("skills", [])
        if not isinstance(raw_skills, list):
            return []

        dedup: dict[str, dict] = {}
        for item in raw_skills:
            if not isinstance(item, dict):
                continue
            name = str(item.get("skill_name", "")).strip()
            if not name:
                continue
            key = name.lower()
            dedup[key] = {
                "skill_name": name,
                "category": str(item.get("category", "")).strip() or "general",
                "evidence": str(item.get("evidence", "")).strip()[:400] or None,
            }
        return list(dedup.values())

    def extract_skills(self, text: str) -> list[dict]:
        client = self._get_client()
        model = client.GenerativeModel(self._model_name)
        prompt = f"{_PROMPT}\n\nResume text:\n{text[:12000]}"
        response = model.generate_content(prompt)
        raw = (response.text or "").strip()
        payload = self._extract_json_payload(raw)
        return self._normalize(payload)

