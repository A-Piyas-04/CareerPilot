"""Tests for shared RAG context retrieval."""
from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from app.cv_intelligence.services import rag_context_service


def test_retrieve_cv_context_no_resume() -> None:
    supabase = MagicMock()
    with patch(
        "app.cv_intelligence.services.rag_context_service.resume_service.get_active_resume_id",
        return_value=None,
    ):
        result = rag_context_service.retrieve_cv_context(
            user_id="user-1",
            query="Am I ready for data engineer?",
            supabase=supabase,
        )
    assert result.has_resume is False
    assert result.chunks == []
    assert result.empty_reason is not None


def test_retrieve_cv_context_returns_chunk_ids() -> None:
    supabase = MagicMock()
    chunks = [
        {
            "chunk_id": "chunk-a",
            "resume_id": "resume-1",
            "section_name": "Experience",
            "chunk_text": "Built APIs with FastAPI",
            "similarity": 0.91,
        }
    ]
    with (
        patch(
            "app.cv_intelligence.services.rag_context_service.resume_service.get_active_resume_id",
            return_value="resume-1",
        ),
        patch(
            "app.cv_intelligence.services.rag_context_service.resume_service.get_resume",
        ) as mock_get_resume,
        patch(
            "app.cv_intelligence.services.rag_context_service.search_chunks",
            return_value=chunks,
        ),
        patch(
            "app.cv_intelligence.services.rag_context_service._fetch_user_skills",
            return_value=["Python", "FastAPI"],
        ),
    ):
        mock_get_resume.return_value = SimpleNamespace(status="processed")
        result = rag_context_service.retrieve_cv_context(
            user_id="user-1",
            query="data engineer role",
            supabase=supabase,
            intent="readiness_check",
        )

    assert result.has_resume is True
    assert result.chunk_ids == ["chunk-a"]
    assert "FastAPI" in result.context_text
    assert result.user_skills == ["Python", "FastAPI"]


def test_intent_top_k_cover_letter() -> None:
    assert rag_context_service._resolve_top_k("cover_letter", None) == 8
    assert rag_context_service._resolve_top_k("general", 3) == 3
