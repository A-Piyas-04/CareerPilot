"""Tests for section_detector — heading matching and section parsing."""
import pytest

from app.cv_intelligence.services.section_detector import (
    _match_heading,
    detect_sections,
)

# ---------------------------------------------------------------------------
# _match_heading
# ---------------------------------------------------------------------------

class TestMatchHeading:
    def test_exact_alias_match(self):
        assert _match_heading("summary") == "summary"
        assert _match_heading("education") == "education"
        assert _match_heading("skills") == "skills"

    def test_title_case_match(self):
        assert _match_heading("Summary") == "summary"
        assert _match_heading("Work Experience") == "experience"
        assert _match_heading("Technical Skills") == "skills"

    def test_all_caps_match(self):
        assert _match_heading("EDUCATION") == "education"
        assert _match_heading("SKILLS") == "skills"
        assert _match_heading("PROJECTS") == "projects"

    def test_trailing_colon_stripped(self):
        assert _match_heading("Skills:") == "skills"
        assert _match_heading("Experience:") == "experience"

    def test_alias_variants(self):
        assert _match_heading("work history") == "experience"
        assert _match_heading("certifications") == "certifications"
        assert _match_heading("awards") == "achievements"
        assert _match_heading("languages") == "languages"

    def test_long_line_not_a_heading(self):
        long_line = "This is a very long line that definitely is not a heading " * 3
        assert _match_heading(long_line) is None

    def test_empty_line_not_a_heading(self):
        assert _match_heading("") is None
        assert _match_heading("   ") is None

    def test_regular_text_not_a_heading(self):
        assert _match_heading("I worked at Google from 2018 to 2021") is None

    def test_partial_prefix_match(self):
        # "Skills & Technologies" starts with "skills"
        result = _match_heading("Skills & Technologies")
        assert result == "skills"


# ---------------------------------------------------------------------------
# detect_sections
# ---------------------------------------------------------------------------

SAMPLE_CV = """\
John Smith
john@example.com

Summary
Experienced software engineer with 8 years building web applications.

Experience
Software Engineer at Acme Corp (2020-2024)
Led backend development using Python and FastAPI.

Education
BSc Computer Science, State University, 2016

Skills
Python, FastAPI, PostgreSQL, Docker, React
"""


class TestDetectSections:
    def test_known_sections_detected(self):
        sections = detect_sections(SAMPLE_CV)
        names = [s["section_name"] for s in sections]
        assert "summary" in names
        assert "experience" in names
        assert "education" in names
        assert "skills" in names

    def test_sections_have_required_keys(self):
        sections = detect_sections(SAMPLE_CV)
        for s in sections:
            assert "section_name" in s
            assert "content" in s
            assert "section_order" in s

    def test_section_order_is_sequential(self):
        sections = detect_sections(SAMPLE_CV)
        orders = [s["section_order"] for s in sections]
        assert orders == sorted(orders)

    def test_section_content_is_non_empty(self):
        sections = detect_sections(SAMPLE_CV)
        for s in sections:
            assert s["content"].strip(), f"Section '{s['section_name']}' has empty content"

    def test_content_belongs_to_correct_section(self):
        sections = detect_sections(SAMPLE_CV)
        skill_section = next(s for s in sections if s["section_name"] == "skills")
        assert "Python" in skill_section["content"]

        exp_section = next(s for s in sections if s["section_name"] == "experience")
        assert "FastAPI" in exp_section["content"]

    def test_no_headings_falls_back_to_general(self):
        plain_text = "John Smith is a developer. He knows Python and Docker."
        sections = detect_sections(plain_text)
        assert len(sections) == 1
        assert sections[0]["section_name"] == "general"
        assert "Python" in sections[0]["content"]

    def test_empty_text_falls_back_to_general(self):
        sections = detect_sections("   ")
        assert len(sections) == 1
        assert sections[0]["section_name"] == "general"

    def test_single_section(self):
        text = "Skills\nPython Django React Docker PostgreSQL"
        sections = detect_sections(text)
        assert len(sections) == 1
        assert sections[0]["section_name"] == "skills"

    def test_duplicate_section_names_allowed(self):
        """Same heading appearing twice should produce two entries."""
        text = "Skills\nPython\nSkills\nJavaScript"
        sections = detect_sections(text)
        names = [s["section_name"] for s in sections]
        assert names.count("skills") == 2
