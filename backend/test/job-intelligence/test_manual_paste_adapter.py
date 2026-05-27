"""Tests for the manual-paste job source adapter."""
import pytest

from app.job_intelligence.models.job import JobCreate
from app.job_intelligence.services.sources.manual_paste import ManualPasteAdapter


class TestManualPasteAdapter:
    def test_returns_single_jobcreate(self):
        adapter = ManualPasteAdapter()
        results = adapter.parse(
            title="Backend Engineer",
            description="Build APIs with Python and FastAPI.",
            company="Acme",
            location="Remote",
            source_url="https://acme.example.com/jobs/1",
        )
        assert len(results) == 1
        assert isinstance(results[0], JobCreate)

    def test_fields_passed_through(self):
        adapter = ManualPasteAdapter()
        [job] = adapter.parse(
            title="Backend Engineer",
            description="Build APIs.",
            company="Acme",
            location="Remote",
            source_url="https://acme.example.com/jobs/1",
        )
        assert job.title == "Backend Engineer"
        assert job.description == "Build APIs."
        assert job.company == "Acme"
        assert job.location == "Remote"
        assert job.source_url == "https://acme.example.com/jobs/1"
        assert job.source == "manual"

    def test_optional_fields_default_to_none(self):
        adapter = ManualPasteAdapter()
        [job] = adapter.parse(
            title="Backend Engineer",
            description="Build APIs.",
        )
        assert job.company is None
        assert job.location is None
        assert job.source_url is None
        assert job.source == "manual"

    def test_blank_title_raises(self):
        adapter = ManualPasteAdapter()
        with pytest.raises(ValueError, match="title"):
            adapter.parse(title="   ", description="x")

    def test_blank_description_raises(self):
        adapter = ManualPasteAdapter()
        with pytest.raises(ValueError, match="description"):
            adapter.parse(title="Backend Engineer", description="")
