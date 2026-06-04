"""Tests for in-app CV builder — section validation and raw text composition."""
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from fastapi import HTTPException

from app.core.enums import ResumeStatus
from app.cv_intelligence.services import resume_service
from app.cv_intelligence.services.resume_service import (
    compose_raw_text,
    validate_builder_sections,
)


class TestComposeRawText:
    def test_joins_sections_with_headings(self):
        sections = [
            {"section_name": "experience", "content": "Engineer at Acme"},
            {"section_name": "education", "content": "BSc Computer Science"},
        ]
        text = compose_raw_text(sections)
        assert "Experience" in text
        assert "Engineer at Acme" in text
        assert "Education" in text
        assert "BSc Computer Science" in text

    def test_skips_empty_content(self):
        sections = [
            {"section_name": "summary", "content": "  "},
            {"section_name": "skills", "content": "Python, TypeScript"},
        ]
        text = compose_raw_text(sections)
        assert "Skills" in text
        assert "Python" in text
        assert "Summary" not in text


class TestValidateBuilderSections:
    def test_normalizes_valid_sections(self):
        result = validate_builder_sections(
            [
                {"section_name": "Experience", "content": "Built APIs"},
                {"section_name": "skills", "content": "Go, Rust"},
            ]
        )
        assert len(result) == 2
        assert result[0]["section_name"] == "experience"
        assert result[0]["section_order"] == 0
        assert result[1]["section_name"] == "skills"

    def test_rejects_empty_list(self):
        with pytest.raises(HTTPException) as exc_info:
            validate_builder_sections([])
        assert exc_info.value.status_code == 422

    def test_rejects_all_empty_content(self):
        with pytest.raises(HTTPException) as exc_info:
            validate_builder_sections(
                [{"section_name": "summary", "content": "   "}]
            )
        assert exc_info.value.status_code == 422

    def test_accepts_languages_section(self):
        result = validate_builder_sections(
            [{"section_name": "languages", "content": "English (fluent), Bengali (native)"}]
        )
        assert result[0]["section_name"] == "languages"

    def test_normalizes_unknown_section_to_summary(self):
        result = validate_builder_sections(
            [{"section_name": "custom_heading", "content": "Some text"}]
        )
        assert result[0]["section_name"] == "summary"

    def test_rejects_too_many_sections(self):
        sections = [
            {"section_name": "summary", "content": f"Block {i}"}
            for i in range(13)
        ]
        with pytest.raises(HTTPException) as exc_info:
            validate_builder_sections(sections)
        assert exc_info.value.status_code == 422


class TestSetActiveResume:
    def test_rejects_non_processed_resume(self):
        with patch(
            "app.cv_intelligence.services.resume_service._get_owned_resume",
            return_value=SimpleNamespace(status=ResumeStatus.UPLOADED),
        ):
            with pytest.raises(HTTPException) as exc_info:
                resume_service.set_active_resume("user-1", "r1")
            assert exc_info.value.status_code == 422

    def test_activates_processed_resume(self):
        with patch(
            "app.cv_intelligence.services.resume_service._get_owned_resume",
            return_value=SimpleNamespace(status=ResumeStatus.PROCESSED),
        ):
            with patch(
                "app.cv_intelligence.services.resume_service._deactivate_other_resumes",
            ) as deactivate:
                with patch(
                    "app.cv_intelligence.services.resume_service.run_supabase",
                    return_value=SimpleNamespace(data={}),
                ):
                    with patch(
                        "app.cv_intelligence.services.resume_service._row",
                        return_value={
                            "id": "r1",
                            "user_id": "user-1",
                            "file_name": "cv.pdf",
                            "file_type": "pdf",
                            "status": ResumeStatus.PROCESSED.value,
                            "is_active": True,
                            "created_at": "2025-01-01T00:00:00Z",
                            "updated_at": "2025-01-01T00:00:00Z",
                        },
                    ):
                        result = resume_service.set_active_resume("user-1", "r1")

        deactivate.assert_called_once()
        assert result.id == "r1"
        assert result.is_active is True


class TestActiveResumeLookup:
    def test_falls_back_to_latest_processed_resume_when_none_is_active(self):
        with patch(
            "app.cv_intelligence.services.resume_service.run_supabase",
            side_effect=[
                SimpleNamespace(data=[]),
                SimpleNamespace(data=[{"id": "resume-processed"}]),
            ],
        ):
            assert resume_service.get_active_resume_id("user-1") == "resume-processed"
