"""Tests for Gemini structured CV parsing helpers."""

from app.cv_intelligence.services import resume_service
from app.cv_intelligence.services.structured_resume_parser import (
    _coerce_payload,
    _extract_json_payload,
    _normalize_payload,
    StructuredResumePayload,
)


def test_extract_json_payload_strips_code_fence():
    payload = _extract_json_payload(
        """```json
        {"title": "CV", "skills": [{"skill_name": "Python"}], "tools": ["Docker"]}
        ```"""
    )

    assert payload["title"] == "CV"
    assert payload["skills"][0]["skill_name"] == "Python"
    assert payload["tools"] == ["Docker"]


def test_normalize_payload_dedupes_skills_and_tools():
    normalized = _normalize_payload(
        StructuredResumePayload.model_validate(
            {
                "title": "  Parsed CV  ",
                "skills": [
                    {"skill_name": " Python ", "category": " language "},
                    {"skill_name": "python", "category": "language"},
                ],
                "tools": [" Docker ", "docker", "Git"],
            }
        )
    )

    assert normalized["title"] == "Parsed CV"
    assert normalized["skills"] == [
        {"skill_name": "Python", "category": "language", "proficiency": None}
    ]
    assert normalized["tools"] == ["Docker", "Git"]


def test_coerce_payload_accepts_skillsync_shaped_fields():
    coerced = _coerce_payload(
        {
            "skills": ["Python"],
            "tools": [{"name": "Docker"}],
            "experiences": [{"title": "Intern", "current": True}],
            "education": [{"degree": "BSc", "field": "CS", "graduation_year": "2024"}],
            "projects": [{"name": "API", "technologies": ["FastAPI", "PostgreSQL"]}],
        }
    )

    assert coerced["skills"][0]["skill_name"] == "Python"
    assert coerced["tools"] == ["Docker"]
    assert coerced["experience"][0]["role"] == "Intern"
    assert coerced["experience"][0]["is_current"] is True
    assert coerced["education"][0]["end_year"] == "2024"
    assert "Field: CS" in coerced["education"][0]["details"]
    assert coerced["projects"][0]["technologies"] == "FastAPI, PostgreSQL"


def test_manual_payload_converter_stores_structured_form_data_and_tools():
    raw_text, sections, skills = resume_service._manual_payload_to_resume_parts(
        {
            "personal": {"full_name": "Ada Lovelace"},
            "summary": "Backend engineer",
            "skills": [{"skill_name": "Python", "category": "language"}],
            "tools": ["Docker", "Git"],
            "experience": [
                {
                    "role": "Intern",
                    "company": "StartupX",
                    "description": "Built APIs",
                }
            ],
        },
        source="gemini_structured",
    )

    section_names = [section["section_name"] for section in sections]
    tools_section = next(section for section in sections if section["section_name"] == "tools")
    experience_section = next(
        section for section in sections if section["section_name"] == "experience"
    )

    assert "SUMMARY" in raw_text
    assert "tools" in section_names
    assert tools_section["metadata"]["source"] == "gemini_structured"
    assert tools_section["metadata"]["form_data"] == ["Docker", "Git"]
    assert experience_section["metadata"]["form_data"][0]["company"] == "StartupX"
    assert {skill["skill_name"] for skill in skills} == {"Python", "Docker", "Git"}
    assert {skill["category"] for skill in skills} == {"language", "tool"}
