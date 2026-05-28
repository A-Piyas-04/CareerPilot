"""Tests for job_scorer — deterministic job-to-resume fit scoring."""
from unittest.mock import patch

from app.job_intelligence.services.job_scorer import score_job


_USER_ID = "00000000-0000-0000-0000-000000000001"
_RESUME_ID = "00000000-0000-0000-0000-000000000002"


def _fake_chunks(similarities: list[float]) -> list[dict]:
    return [
        {
            "chunk_id": f"c{i}",
            "resume_id": _RESUME_ID,
            "section_name": "experience",
            "chunk_text": f"chunk {i}",
            "similarity": s,
        }
        for i, s in enumerate(similarities)
    ]


class TestScoreJob:
    def test_returns_required_keys(self):
        with patch(
            "app.job_intelligence.services.job_scorer.search_chunks",
            return_value=_fake_chunks([0.5, 0.4]),
        ):
            result = score_job(
                user_id=_USER_ID,
                resume_id=_RESUME_ID,
                user_skill_names=["Python", "FastAPI"],
                title="Backend",
                description="Python + FastAPI required.",
                requirements=None,
                supabase=object(),
            )
        for key in ("fit_score", "matched_skills", "missing_skills",
                    "explanation", "evidence_chunk_ids"):
            assert key in result

    def test_fit_score_full_overlap_high_similarity(self):
        with patch(
            "app.job_intelligence.services.job_scorer.search_chunks",
            return_value=_fake_chunks([1.0, 1.0, 1.0, 1.0, 1.0]),
        ):
            result = score_job(
                user_id=_USER_ID,
                resume_id=_RESUME_ID,
                user_skill_names=["Python", "FastAPI"],
                title="Backend",
                description="Python and FastAPI required.",
                requirements=None,
                supabase=object(),
            )
        # 0.6 * 1.0 (2/2 skills) + 0.4 * 1.0 (mean sim) = 1.0 → 100.00
        assert result["fit_score"] == 100.00

    def test_fit_score_no_overlap_zero_similarity(self):
        with patch(
            "app.job_intelligence.services.job_scorer.search_chunks",
            return_value=_fake_chunks([0.0, 0.0]),
        ):
            result = score_job(
                user_id=_USER_ID,
                resume_id=_RESUME_ID,
                user_skill_names=["Python"],
                title="Backend",
                description="Java and Spring Boot required.",
                requirements=None,
                supabase=object(),
            )
        # JD has only "Java" recognized ("Spring Boot" not in skill list);
        # 0/1 matched → skills_component = 0.0; mean_sim = 0.0; score = 0.00
        assert result["fit_score"] == 0.00

    def test_matched_and_missing_skills_partitioned(self):
        with patch(
            "app.job_intelligence.services.job_scorer.search_chunks",
            return_value=_fake_chunks([0.5]),
        ):
            result = score_job(
                user_id=_USER_ID,
                resume_id=_RESUME_ID,
                user_skill_names=["Python", "Docker"],
                title="Backend",
                description="Python, Docker, and Kubernetes required.",
                requirements=None,
                supabase=object(),
            )
        assert sorted(result["matched_skills"]) == ["Docker", "Python"]
        assert result["missing_skills"] == ["Kubernetes"]

    def test_no_jd_skills_yields_zero_skills_component(self):
        with patch(
            "app.job_intelligence.services.job_scorer.search_chunks",
            return_value=_fake_chunks([0.5]),
        ):
            result = score_job(
                user_id=_USER_ID,
                resume_id=_RESUME_ID,
                user_skill_names=["Python"],
                title="Wellness coach",
                description="Help people relax and unwind on weekends.",
                requirements=None,
                supabase=object(),
            )
        # skills component = 0.0; chunk_mean = 0.5 → 0.4*0.5 = 0.20 → 20.00
        assert result["fit_score"] == 20.00
        assert result["matched_skills"] == []
        assert result["missing_skills"] == []
        assert "no recognizable skills" in result["explanation"].lower()

    def test_evidence_chunk_ids_returned_in_order(self):
        with patch(
            "app.job_intelligence.services.job_scorer.search_chunks",
            return_value=_fake_chunks([0.9, 0.8, 0.7]),
        ):
            result = score_job(
                user_id=_USER_ID,
                resume_id=_RESUME_ID,
                user_skill_names=["Python"],
                title="Backend",
                description="Python required.",
                requirements=None,
                supabase=object(),
            )
        assert result["evidence_chunk_ids"] == ["c0", "c1", "c2"]

    def test_no_chunks_returned_uses_zero_similarity(self):
        with patch(
            "app.job_intelligence.services.job_scorer.search_chunks",
            return_value=[],
        ):
            result = score_job(
                user_id=_USER_ID,
                resume_id=_RESUME_ID,
                user_skill_names=["Python", "FastAPI"],
                title="Backend",
                description="Python and FastAPI required.",
                requirements=None,
                supabase=object(),
            )
        # 0.6 * 1.0 + 0.4 * 0.0 = 0.60 → 60.00
        assert result["fit_score"] == 60.00
        assert result["evidence_chunk_ids"] == []

    def test_fit_score_rounded_to_two_decimals(self):
        with patch(
            "app.job_intelligence.services.job_scorer.search_chunks",
            return_value=_fake_chunks([0.333333]),
        ):
            result = score_job(
                user_id=_USER_ID,
                resume_id=_RESUME_ID,
                user_skill_names=["Python"],
                title="Backend",
                description="Python required.",
                requirements=None,
                supabase=object(),
            )
        # 0.6 * 1.0 + 0.4 * 0.333333 = 0.7333 → 73.33
        assert result["fit_score"] == 73.33

    def test_explanation_mentions_matched_count(self):
        with patch(
            "app.job_intelligence.services.job_scorer.search_chunks",
            return_value=_fake_chunks([0.5]),
        ):
            result = score_job(
                user_id=_USER_ID,
                resume_id=_RESUME_ID,
                user_skill_names=["Python"],
                title="Backend",
                description="Python and Docker required.",
                requirements=None,
                supabase=object(),
            )
        assert "1/2" in result["explanation"]
