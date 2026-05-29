"""Tests for RAG-grounded career generation."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.career_assistant.services import career_generation_service
from app.cv_intelligence.services.rag_context_service import RagContextResult


def _rag_result() -> RagContextResult:
    return RagContextResult(
        resume_id="resume-1",
        resume_status="processed",
        has_resume=True,
        chunks=[
            {
                "chunk_id": "c1",
                "resume_id": "resume-1",
                "section_name": "Skills",
                "chunk_text": "Python, SQL",
                "similarity": 0.9,
            }
        ],
        chunk_ids=["c1"],
        context_text="[Excerpt 1 — Skills]\nPython, SQL",
        user_skills=["Python"],
    )


def test_generate_cover_letter_uses_rag_chunks() -> None:
    with (
        patch(
            "app.career_assistant.services.career_generation_service._require_rag_context",
            return_value=_rag_result(),
        ),
        patch(
            "app.career_assistant.services.career_generation_service.llm_service.generate_cover_letter",
            return_value="Dear Hiring Manager...",
        ) as mock_llm,
        patch(
            "app.career_assistant.services.career_generation_service.get_supabase_client",
        ) as mock_client,
        patch(
            "app.career_assistant.services.career_generation_service.run_supabase",
        ) as mock_run,
    ):
        mock_run.return_value = MagicMock(
            data=[{"id": "cl-1", "title": "T", "content": "Dear Hiring Manager..."}],
        )
        result = career_generation_service.generate_and_save_cover_letter(
            user_id="user-1",
            job_description="Data engineer JD",
        )
        mock_llm.assert_called_once()
        assert result["used_resume_chunks"] == ["c1"]
        assert result["id"] == "cl-1"
