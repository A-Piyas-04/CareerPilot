"""Tests for Gemini LLM helper messages and model cascade."""
from app.cv_intelligence.services import llm_service


class TestModelCascade:
    def test_defaults_when_env_unset(self, monkeypatch):
        monkeypatch.delenv("GEMINI_MODEL", raising=False)
        monkeypatch.delenv("GEMINI_GENERATION_FALLBACK_MODELS", raising=False)
        cascade = llm_service._model_cascade()
        assert cascade[0] == "gemini-2.5-flash"
        assert "gemini-2.0-flash" in cascade

    def test_prefers_configured_model(self, monkeypatch):
        monkeypatch.setenv("GEMINI_MODEL", "models/gemini-2.0-flash")
        monkeypatch.setenv(
            "GEMINI_GENERATION_FALLBACK_MODELS",
            "gemini-2.5-pro",
        )
        cascade = llm_service._model_cascade()
        assert cascade[0] == "gemini-2.0-flash"
        assert cascade[1] == "gemini-2.5-pro"


class TestUserFacingErrors:
    def test_quota_limit_zero_message(self):
        message = (
            "429 quota exceeded for generate_content_free_tier_requests, limit: 0"
        )
        text = llm_service._user_message_for_failure(message, 429)
        assert "limit: 0" in text
        assert "backend/.env" in text

    def test_extractive_fallback_trigger(self):
        assert llm_service._should_use_extractive_fallback(
            "Gemini API quota or rate limit exceeded."
        )
