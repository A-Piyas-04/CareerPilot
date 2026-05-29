"""Tests for robust Gemini resume JSON parsing."""
from __future__ import annotations

from app.cv_intelligence.services.providers.analysis.gemini_resume_analysis import (
    GeminiResumeAnalysisProvider,
)


def test_extract_json_payload_from_fenced_block() -> None:
    provider = GeminiResumeAnalysisProvider()
    raw = """```json
{"skills":[{"skill_name":"Python","category":"language","evidence":"Python"}]}
```"""
    parsed = provider._extract_json_payload(raw)
    assert parsed["skills"][0]["skill_name"] == "Python"


def test_extract_json_payload_from_noisy_text() -> None:
    provider = GeminiResumeAnalysisProvider()
    raw = 'Here you go: {"skills":[{"skill_name":"Docker","category":"devops","evidence":"Docker"}]}'
    parsed = provider._extract_json_payload(raw)
    assert parsed["skills"][0]["skill_name"] == "Docker"


def test_extract_json_payload_bad_json_returns_empty() -> None:
    provider = GeminiResumeAnalysisProvider()
    assert provider._extract_json_payload("not-json") == {}

