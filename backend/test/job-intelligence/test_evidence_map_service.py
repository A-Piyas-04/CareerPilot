"""Tests for evidence_map_service — JD ↔ CV evidence map."""
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.job_intelligence.services import evidence_map_service

_USER_ID = "00000000-0000-0000-0000-000000000001"
_MATCH_ID = "00000000-0000-0000-0000-000000000002"
_RESUME_ID = "00000000-0000-0000-0000-000000000003"
_JOB_ID = "00000000-0000-0000-0000-000000000004"


def _fake_chunks(similarities: list[float]) -> list[dict]:
    return [
        {
            "chunk_id": f"c{i}",
            "resume_id": _RESUME_ID,
            "section_name": "experience",
            "chunk_text": f"chunk text {i}",
            "similarity": s,
        }
        for i, s in enumerate(similarities)
    ]


def _match_row(*, description: str = "Python and FastAPI required.") -> dict:
    return {
        "id": _MATCH_ID,
        "job_id": _JOB_ID,
        "resume_id": _RESUME_ID,
        "fit_score": 75.0,
        "matched_skills": ["Python"],
        "missing_skills": ["Kubernetes"],
        "jobs": {
            "id": _JOB_ID,
            "title": "Backend Engineer",
            "company": "Acme",
            "location": "Remote",
            "description": description,
            "requirements": None,
        },
    }


def _mock_supabase(match_row: dict | None) -> MagicMock:
    supabase = MagicMock()
    execute = MagicMock()
    execute.data = [match_row] if match_row else []
    limit = MagicMock()
    limit.execute.return_value = execute
    eq_user = MagicMock()
    eq_user.limit.return_value = limit
    eq_match = MagicMock()
    eq_match.eq.return_value = eq_user
    select = MagicMock()
    select.eq.return_value = eq_match
    table = MagicMock()
    table.select.return_value = select
    supabase.table.return_value = table
    return supabase


def _batch_side_effect(similarities: list[float] | None = None):
    """Return one chunk list per query for search_chunks_batch mocks."""

    def _side_effect(*args, **kwargs):
        queries = kwargs.get("queries") or (args[1] if len(args) > 1 else [])
        sims = similarities if similarities is not None else [0.1]
        return [_fake_chunks(sims) for _ in queries]

    return _side_effect


class TestBuildEvidenceMap:
    @patch("app.job_intelligence.services.evidence_map_service._extract_requirements_with_gemini")
    @patch("app.job_intelligence.services.evidence_map_service.search_chunks_batch")
    @patch("app.job_intelligence.services.evidence_map_service._list_user_skill_names")
    @patch("app.job_intelligence.services.evidence_map_service.validate_resume_for_scoring")
    def test_strong_skill_with_high_similarity(
        self,
        mock_validate,
        mock_skills,
        mock_search,
        mock_llm,
    ):
        mock_skills.return_value = ["Python", "FastAPI"]
        mock_search.side_effect = _batch_side_effect([0.6, 0.5])
        mock_llm.return_value = []

        result = evidence_map_service.build_evidence_map(
            user_id=_USER_ID,
            match_id=_MATCH_ID,
            supabase=_mock_supabase(_match_row()),
        )

        python_rows = [r for r in result["rows"] if r["label"] == "Python"]
        assert len(python_rows) == 1
        assert python_rows[0]["status"] == "strong"
        assert len(python_rows[0]["evidence_chunks"]) >= 1

    @patch("app.job_intelligence.services.evidence_map_service._extract_requirements_with_gemini")
    @patch("app.job_intelligence.services.evidence_map_service.search_chunks_batch")
    @patch("app.job_intelligence.services.evidence_map_service._list_user_skill_names")
    @patch("app.job_intelligence.services.evidence_map_service.validate_resume_for_scoring")
    def test_missing_skill_with_no_chunks(
        self,
        mock_validate,
        mock_skills,
        mock_search,
        mock_llm,
    ):
        mock_skills.return_value = ["Python"]
        mock_search.side_effect = lambda *a, **k: [[] for _ in (k.get("queries") or [])]
        mock_llm.return_value = []

        result = evidence_map_service.build_evidence_map(
            user_id=_USER_ID,
            match_id=_MATCH_ID,
            supabase=_mock_supabase(_match_row(description="Kubernetes required.")),
        )

        k8s_rows = [r for r in result["rows"] if r["label"] == "Kubernetes"]
        assert len(k8s_rows) == 1
        assert k8s_rows[0]["status"] == "missing"
        assert k8s_rows[0]["evidence_chunks"] == []

    @patch("app.job_intelligence.services.evidence_map_service._extract_requirements_with_gemini")
    @patch("app.job_intelligence.services.evidence_map_service.search_chunks_batch")
    @patch("app.job_intelligence.services.evidence_map_service._list_user_skill_names")
    @patch("app.job_intelligence.services.evidence_map_service.validate_resume_for_scoring")
    def test_fit_score_missing_skill_stays_missing_with_low_similarity(
        self,
        mock_validate,
        mock_skills,
        mock_search,
        mock_llm,
    ):
        mock_skills.return_value = ["Python"]
        mock_search.side_effect = _batch_side_effect([0.05])
        mock_llm.return_value = []

        result = evidence_map_service.build_evidence_map(
            user_id=_USER_ID,
            match_id=_MATCH_ID,
            supabase=_mock_supabase(_match_row()),
        )

        k8s_rows = [r for r in result["rows"] if r["label"] == "Kubernetes"]
        assert len(k8s_rows) == 1
        assert k8s_rows[0]["status"] == "missing"

    @patch("app.job_intelligence.services.evidence_map_service._extract_requirements_with_gemini")
    @patch("app.job_intelligence.services.evidence_map_service.search_chunks_batch")
    @patch("app.job_intelligence.services.evidence_map_service._list_user_skill_names")
    @patch("app.job_intelligence.services.evidence_map_service.validate_resume_for_scoring")
    def test_weak_semantic_match(
        self,
        mock_validate,
        mock_skills,
        mock_search,
        mock_llm,
    ):
        mock_skills.return_value = []
        mock_search.side_effect = _batch_side_effect([0.30])
        mock_llm.return_value = []

        result = evidence_map_service.build_evidence_map(
            user_id=_USER_ID,
            match_id=_MATCH_ID,
            supabase=_mock_supabase(_match_row(description="Docker experience required.")),
        )

        docker_rows = [r for r in result["rows"] if r["label"] == "Docker"]
        assert len(docker_rows) == 1
        assert docker_rows[0]["status"] == "weak"

    @patch("app.job_intelligence.services.evidence_map_service._extract_requirements_with_gemini")
    @patch("app.job_intelligence.services.evidence_map_service.search_chunks_batch")
    @patch("app.job_intelligence.services.evidence_map_service._list_user_skill_names")
    @patch("app.job_intelligence.services.evidence_map_service.validate_resume_for_scoring")
    def test_jd_bullet_parsed(
        self,
        mock_validate,
        mock_skills,
        mock_search,
        mock_llm,
    ):
        mock_skills.return_value = ["Python"]
        mock_search.side_effect = _batch_side_effect([0.1])
        mock_llm.return_value = []

        description = "- Minimum 3 years of backend development experience required."
        result = evidence_map_service.build_evidence_map(
            user_id=_USER_ID,
            match_id=_MATCH_ID,
            supabase=_mock_supabase(_match_row(description=description)),
        )

        jd_rows = [r for r in result["rows"] if r["source"] == "jd_parse"]
        assert len(jd_rows) >= 1

    @patch("app.job_intelligence.services.evidence_map_service._extract_requirements_with_gemini")
    @patch("app.job_intelligence.services.evidence_map_service.search_chunks_batch")
    @patch("app.job_intelligence.services.evidence_map_service._list_user_skill_names")
    @patch("app.job_intelligence.services.evidence_map_service.validate_resume_for_scoring")
    def test_dedup_skill_and_jd_line(
        self,
        mock_validate,
        mock_skills,
        mock_search,
        mock_llm,
    ):
        mock_skills.return_value = ["Python"]
        mock_search.side_effect = _batch_side_effect([0.6])
        mock_llm.return_value = []

        description = "Python required.\n- Python experience is required for this role."
        result = evidence_map_service.build_evidence_map(
            user_id=_USER_ID,
            match_id=_MATCH_ID,
            supabase=_mock_supabase(_match_row(description=description)),
        )

        python_rows = [r for r in result["rows"] if "python" in r["label"].lower()]
        assert len(python_rows) == 1
        assert python_rows[0]["source"] == "skill_extraction"

    @patch("app.job_intelligence.services.evidence_map_service._extract_requirements_with_gemini")
    @patch("app.job_intelligence.services.evidence_map_service.search_chunks_batch")
    @patch("app.job_intelligence.services.evidence_map_service._list_user_skill_names")
    @patch("app.job_intelligence.services.evidence_map_service.validate_resume_for_scoring")
    def test_no_processed_resume(
        self,
        mock_validate,
        mock_skills,
        mock_search,
        mock_llm,
    ):
        mock_validate.side_effect = ValueError("Upload and process your CV first.")

        result = evidence_map_service.build_evidence_map(
            user_id=_USER_ID,
            match_id=_MATCH_ID,
            supabase=_mock_supabase(_match_row()),
        )

        assert result["empty_reason"] == "no_processed_resume"
        assert result["rows"] == []

    @patch("app.job_intelligence.services.evidence_map_service._extract_requirements_with_gemini")
    @patch("app.job_intelligence.services.evidence_map_service.search_chunks_batch")
    @patch("app.job_intelligence.services.evidence_map_service._list_user_skill_names")
    @patch("app.job_intelligence.services.evidence_map_service.validate_resume_for_scoring")
    def test_max_rows_cap(
        self,
        mock_validate,
        mock_skills,
        mock_search,
        mock_llm,
    ):
        mock_skills.return_value = []
        mock_search.side_effect = _batch_side_effect([0.1])
        mock_llm.return_value = []

        skills = " ".join(
            [
                "Python",
                "Java",
                "Go",
                "Rust",
                "Ruby",
                "React",
                "Vue.js",
                "Angular",
                "Docker",
                "Kubernetes",
                "AWS",
                "GCP",
                "Azure",
                "PostgreSQL",
                "MongoDB",
                "Redis",
                "GraphQL",
                "TensorFlow",
                "PyTorch",
                "FastAPI",
                "Django",
                "Flask",
            ]
        )
        result = evidence_map_service.build_evidence_map(
            user_id=_USER_ID,
            match_id=_MATCH_ID,
            supabase=_mock_supabase(_match_row(description=f"{skills} required.")),
        )

        assert len(result["rows"]) <= 20

    @patch("app.job_intelligence.services.evidence_map_service._extract_requirements_with_gemini")
    @patch("app.job_intelligence.services.evidence_map_service.search_chunks_batch")
    @patch("app.job_intelligence.services.evidence_map_service._list_user_skill_names")
    @patch("app.job_intelligence.services.evidence_map_service.validate_resume_for_scoring")
    def test_llm_fallback_still_returns_rows(
        self,
        mock_validate,
        mock_skills,
        mock_search,
        mock_llm,
    ):
        mock_skills.return_value = ["Python"]
        mock_search.side_effect = _batch_side_effect([0.6])
        mock_llm.side_effect = RuntimeError("Gemini unavailable")

        result = evidence_map_service.build_evidence_map(
            user_id=_USER_ID,
            match_id=_MATCH_ID,
            supabase=_mock_supabase(_match_row()),
        )

        assert len(result["rows"]) >= 1

    def test_match_not_found_raises_404(self):
        with pytest.raises(HTTPException) as exc:
            evidence_map_service.build_evidence_map(
                user_id=_USER_ID,
                match_id=_MATCH_ID,
                supabase=_mock_supabase(None),
            )
        assert exc.value.status_code == 404

    @patch("app.job_intelligence.services.evidence_map_service._extract_requirements_with_gemini")
    @patch("app.job_intelligence.services.evidence_map_service.search_chunks_batch")
    @patch("app.job_intelligence.services.evidence_map_service._list_user_skill_names")
    @patch("app.job_intelligence.services.evidence_map_service.validate_resume_for_scoring")
    def test_summary_counts(
        self,
        mock_validate,
        mock_skills,
        mock_search,
        mock_llm,
    ):
        mock_skills.return_value = ["Python"]
        mock_search.side_effect = _batch_side_effect([0.6])
        mock_llm.return_value = []

        result = evidence_map_service.build_evidence_map(
            user_id=_USER_ID,
            match_id=_MATCH_ID,
            supabase=_mock_supabase(_match_row(description="Python and Kubernetes required.")),
        )

        summary = result["summary"]
        assert summary["total_requirements"] == len(result["rows"])
        assert (
            summary["strong_count"] + summary["weak_count"] + summary["missing_count"]
            == summary["total_requirements"]
        )
