"""Tests for skill_extractor — deterministic keyword-based skill extraction."""
import pytest

from app.cv_intelligence.services.skill_extractor import extract_skills


# ---------------------------------------------------------------------------
# Basic detection
# ---------------------------------------------------------------------------

class TestExtractSkillsBasic:
    def test_returns_list(self):
        result = extract_skills("Python developer")
        assert isinstance(result, list)

    def test_each_result_has_required_keys(self):
        results = extract_skills("Python and Docker")
        for r in results:
            assert "skill_name" in r
            assert "category" in r
            assert "evidence" in r

    def test_empty_text_returns_empty(self):
        assert extract_skills("") == []

    def test_no_skills_text_returns_empty(self):
        result = extract_skills("I enjoy hiking and reading novels on weekends.")
        assert result == []


# ---------------------------------------------------------------------------
# Language detection
# ---------------------------------------------------------------------------

class TestLanguageDetection:
    def test_python_detected(self):
        skills = extract_skills("Proficient in Python and its ecosystem.")
        names = [s["skill_name"] for s in skills]
        assert "Python" in names

    def test_javascript_detected(self):
        skills = extract_skills("Built apps with JavaScript and TypeScript.")
        names = [s["skill_name"] for s in skills]
        assert "JavaScript" in names
        assert "TypeScript" in names

    def test_sql_detected(self):
        skills = extract_skills("Wrote complex SQL queries for reporting.")
        names = [s["skill_name"] for s in skills]
        assert "SQL" in names

    def test_category_is_language(self):
        skills = extract_skills("Experienced Python developer.")
        py = next(s for s in skills if s["skill_name"] == "Python")
        assert py["category"] == "language"


# ---------------------------------------------------------------------------
# Framework detection
# ---------------------------------------------------------------------------

class TestFrameworkDetection:
    def test_react_detected(self):
        skills = extract_skills("Frontend built with React and Tailwind.")
        names = [s["skill_name"] for s in skills]
        assert "React" in names

    def test_fastapi_detected(self):
        skills = extract_skills("REST APIs using FastAPI and Pydantic.")
        names = [s["skill_name"] for s in skills]
        assert "FastAPI" in names

    def test_nextjs_detected(self):
        skills = extract_skills("Full-stack with Next.js and React.")
        names = [s["skill_name"] for s in skills]
        assert "Next.js" in names

    def test_category_is_framework(self):
        skills = extract_skills("Built with FastAPI.")
        fa = next(s for s in skills if s["skill_name"] == "FastAPI")
        assert fa["category"] == "framework"


# ---------------------------------------------------------------------------
# Database detection
# ---------------------------------------------------------------------------

class TestDatabaseDetection:
    def test_postgresql_detected(self):
        skills = extract_skills("Used PostgreSQL and Redis for storage.")
        names = [s["skill_name"] for s in skills]
        assert "PostgreSQL" in names
        assert "Redis" in names

    def test_postgres_alias_detected(self):
        skills = extract_skills("Database: postgres with pgvector extension.")
        names = [s["skill_name"] for s in skills]
        assert "PostgreSQL" in names

    def test_mongodb_detected(self):
        skills = extract_skills("Stored data in MongoDB.")
        names = [s["skill_name"] for s in skills]
        assert "MongoDB" in names


# ---------------------------------------------------------------------------
# DevOps / Cloud detection
# ---------------------------------------------------------------------------

class TestDevOpsCloudDetection:
    def test_docker_detected(self):
        skills = extract_skills("Containerised with Docker and Kubernetes.")
        names = [s["skill_name"] for s in skills]
        assert "Docker" in names
        assert "Kubernetes" in names

    def test_git_detected(self):
        skills = extract_skills("Version control with git and GitHub.")
        names = [s["skill_name"] for s in skills]
        assert "Git" in names
        assert "GitHub" in names

    def test_aws_detected(self):
        skills = extract_skills("Deployed on AWS using EC2 and S3.")
        names = [s["skill_name"] for s in skills]
        assert "AWS" in names

    def test_docker_category_is_devops(self):
        skills = extract_skills("Using Docker.")
        d = next(s for s in skills if s["skill_name"] == "Docker")
        assert d["category"] == "devops"

    def test_aws_category_is_cloud(self):
        skills = extract_skills("Deployed on AWS.")
        a = next(s for s in skills if s["skill_name"] == "AWS")
        assert a["category"] == "cloud"


# ---------------------------------------------------------------------------
# ML / AI detection
# ---------------------------------------------------------------------------

class TestMLAIDetection:
    def test_machine_learning_detected(self):
        skills = extract_skills("Built machine learning pipelines with PyTorch.")
        names = [s["skill_name"] for s in skills]
        assert "Machine Learning" in names
        assert "PyTorch" in names

    def test_rag_detected(self):
        skills = extract_skills("Implemented a RAG pipeline using LangChain.")
        names = [s["skill_name"] for s in skills]
        assert "RAG" in names
        assert "LangChain" in names

    def test_nlp_detected(self):
        skills = extract_skills("Experience in NLP and text classification.")
        names = [s["skill_name"] for s in skills]
        assert "NLP" in names


# ---------------------------------------------------------------------------
# Deduplication
# ---------------------------------------------------------------------------

class TestDeduplication:
    def test_same_skill_mentioned_twice_not_duplicated(self):
        text = "Python developer. Python is my main language."
        skills = extract_skills(text)
        python_hits = [s for s in skills if s["skill_name"] == "Python"]
        assert len(python_hits) == 1

    def test_alias_and_canonical_not_duplicated(self):
        text = "Using postgres and PostgreSQL for the database."
        skills = extract_skills(text)
        pg_hits = [s for s in skills if s["skill_name"] == "PostgreSQL"]
        assert len(pg_hits) == 1


# ---------------------------------------------------------------------------
# Evidence field
# ---------------------------------------------------------------------------

class TestEvidenceField:
    def test_evidence_contains_skill_context(self):
        text = "I have used Python extensively for data science work."
        skills = extract_skills(text)
        py = next(s for s in skills if s["skill_name"] == "Python")
        assert "Python" in py["evidence"]

    def test_evidence_is_string(self):
        skills = extract_skills("Python and Docker.")
        for s in skills:
            assert isinstance(s["evidence"], str)

    def test_evidence_no_raw_newlines(self):
        text = "Skills:\nPython\nFastAPI\nDocker"
        skills = extract_skills(text)
        for s in skills:
            assert "\n" not in s["evidence"]


# ---------------------------------------------------------------------------
# Full CV text
# ---------------------------------------------------------------------------

FULL_CV = """
John Smith — Senior Software Engineer
Summary: 8 years building backend services.

Skills: Python, TypeScript, FastAPI, React, Next.js, PostgreSQL,
Docker, Kubernetes, Git, GitHub, AWS, Redis, Machine Learning, NLP

Experience:
- Lead engineer at Startup Inc. Built RAG pipeline with LangChain.
- Backend APIs with Django and Flask.

Education: BSc Computer Science
"""


class TestFullCVExtraction:
    def test_extracts_many_skills(self):
        skills = extract_skills(FULL_CV)
        assert len(skills) >= 10

    def test_all_expected_skills_found(self):
        skills = extract_skills(FULL_CV)
        names = {s["skill_name"] for s in skills}
        expected = {"Python", "TypeScript", "FastAPI", "React", "PostgreSQL",
                    "Docker", "GitHub", "AWS", "Machine Learning", "NLP", "RAG"}
        missing = expected - names
        assert not missing, f"Expected skills not found: {missing}"

    def test_all_categories_represented(self):
        skills = extract_skills(FULL_CV)
        categories = {s["category"] for s in skills}
        assert "language" in categories
        assert "framework" in categories
        assert "database" in categories
        assert "devops" in categories
        assert "cloud" in categories
