"""Provider and fallback behavior tests for skill extraction."""
from __future__ import annotations

import pytest

from app.cv_intelligence.services import skill_extractor


class _ProviderOk:
    def extract_skills(self, text: str) -> list[dict]:
        return [
            {
                "skill_name": "Python",
                "category": "language",
                "evidence": "Python",
            }
        ]


class _ProviderFails:
    def extract_skills(self, text: str) -> list[dict]:
        raise RuntimeError("boom")


def test_provider_result_preferred(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(skill_extractor, "get_analysis_provider", lambda: _ProviderOk())
    result = skill_extractor.extract_skills("irrelevant")
    assert result[0]["skill_name"] == "Python"


def test_fallback_used_when_provider_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        skill_extractor,
        "get_analysis_provider",
        lambda: _ProviderFails(),
    )
    result = skill_extractor.extract_skills("Worked with Docker on Linux.")
    names = {item["skill_name"] for item in result}
    assert "Docker" in names

