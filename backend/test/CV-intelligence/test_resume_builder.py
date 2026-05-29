"""Tests for in-app CV builder — section validation and raw text composition."""
import pytest
from fastapi import HTTPException

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
