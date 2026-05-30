"""Tests for job_service orchestration (search → score → persist)."""
from unittest.mock import MagicMock, patch

import pytest

from app.job_intelligence.models.job import JobCreate
from app.job_intelligence.services import job_service


_USER_ID = "00000000-0000-0000-0000-000000000001"
_RESUME_ID = "00000000-0000-0000-0000-000000000002"
_SEARCH_ID = "00000000-0000-0000-0000-000000000010"
_JOB_ID = "00000000-0000-0000-0000-000000000020"
_MATCH_ID = "00000000-0000-0000-0000-000000000030"


def _resp(data):
    """Build a Supabase-style response object."""
    m = MagicMock()
    m.data = data
    return m


class _SupabaseStub:
    """Mock Supabase client capturing table-chain calls."""

    def __init__(self) -> None:
        self.inserts: list[tuple[str, dict | list[dict]]] = []
        self.upserts: list[tuple[str, dict | list[dict], dict]] = []
        # table_name -> list of canned responses for SELECT calls
        self.select_responses: dict[str, list] = {}

    def table(self, name: str) -> "_TableStub":
        return _TableStub(name=name, parent=self)


class _TableStub:
    def __init__(self, *, name: str, parent: _SupabaseStub) -> None:
        self._name = name
        self._parent = parent
        self._filters: list[tuple] = []
        self._selected: str | None = None
        self._payload: dict | list[dict] | None = None
        self._mode: str | None = None
        self._on_conflict: str | None = None
        self._limit: int | None = None

    def select(self, cols: str) -> "_TableStub":
        self._selected = cols
        self._mode = "select"
        return self

    def insert(self, payload):
        self._payload = payload
        self._mode = "insert"
        return self

    def upsert(self, payload, on_conflict: str | None = None):
        self._payload = payload
        self._mode = "upsert"
        self._on_conflict = on_conflict or ""
        return self

    def eq(self, col: str, val) -> "_TableStub":
        self._filters.append((col, val))
        return self

    def in_(self, col: str, val) -> "_TableStub":
        self._filters.append(("in", col, val))
        return self

    def update(self, payload):
        self._payload = payload
        self._mode = "update"
        return self

    def limit(self, n: int) -> "_TableStub":
        self._limit = n
        return self

    def order(self, *_args, **_kwargs) -> "_TableStub":
        return self

    def execute(self):
        if self._mode == "insert":
            self._parent.inserts.append((self._name, self._payload))
            payload = self._payload
            if isinstance(payload, list):
                rows = [{**p, "id": f"{self._name}-id-{i}"} for i, p in enumerate(payload)]
            else:
                rows = [{**payload, "id": f"{self._name}-id-0"}]
            return _resp(rows)
        if self._mode == "upsert":
            self._parent.upserts.append((self._name, self._payload, {"on_conflict": self._on_conflict}))
            payload = self._payload
            if isinstance(payload, list):
                rows = [{**p, "id": f"{self._name}-id-{i}"} for i, p in enumerate(payload)]
            else:
                rows = [{**payload, "id": f"{self._name}-id-0"}]
            return _resp(rows)
        # select
        canned = self._parent.select_responses.get(self._name)
        if canned is not None:
            return _resp(canned.pop(0) if canned else [])
        return _resp([])


@pytest.fixture
def supabase():
    return _SupabaseStub()


def _fake_source(jobs: list[JobCreate]):
    src = MagicMock()
    src.name = "jsearch"
    src.search.return_value = jobs
    return src


_SCORE_RESULT = {
    "fit_score": 75.50,
    "matched_skills": ["Python"],
    "missing_skills": ["Go"],
    "explanation": "Matched 1/2 JD skills.",
    "evidence_chunk_ids": ["c0", "c1"],
}


class TestSearchAndMatch:
    def test_persists_job_search_row(self, supabase):
        source = _fake_source([
            JobCreate(title="Backend", description="Python", source="jsearch", source_url="u1"),
        ])
        supabase.select_responses["resumes"] = [[{"id": _RESUME_ID, "status": "processed"}]]
        supabase.select_responses["user_skills"] = [
            [{"skill_name": "Python"}],
        ]
        with patch(
            "app.job_intelligence.services.job_service.score_job",
            return_value=_SCORE_RESULT,
        ):
            job_service.search_and_match(
                user_id=_USER_ID,
                resume_id=_RESUME_ID,
                query="python",
                location="Berlin",
                source=source,
                supabase=supabase,
            )

        inserted_tables = [name for name, _ in supabase.inserts]
        assert "job_searches" in inserted_tables
        row = next(payload for name, payload in supabase.inserts if name == "job_searches")
        assert row["user_id"] == _USER_ID
        assert row["query"] == "python"
        assert row["location"] == "Berlin"
        assert row["source"] == "jsearch"

    def test_inserts_jobs_with_search_link(self, supabase):
        source = _fake_source([
            JobCreate(title="Backend", description="Python", source="jsearch", source_url="u1"),
            JobCreate(title="Frontend", description="React", source="jsearch", source_url="u2"),
        ])
        supabase.select_responses["resumes"] = [[{"id": _RESUME_ID, "status": "processed"}]]
        supabase.select_responses["user_skills"] = [[{"skill_name": "Python"}]]
        with patch(
            "app.job_intelligence.services.job_service.score_job",
            return_value=_SCORE_RESULT,
        ):
            job_service.search_and_match(
                user_id=_USER_ID,
                resume_id=_RESUME_ID,
                query="python",
                location=None,
                source=source,
                supabase=supabase,
            )

        inserts_for_jobs = [i for i in supabase.inserts if i[0] == "jobs"]
        assert len(inserts_for_jobs) == 1
        _, payload = inserts_for_jobs[0]
        assert isinstance(payload, list)
        assert len(payload) == 2
        assert all("search_id" in p for p in payload)

    def test_upserts_one_job_match_per_job(self, supabase):
        source = _fake_source([
            JobCreate(title="Backend", description="Python", source="jsearch", source_url="u1"),
            JobCreate(title="Frontend", description="React", source="jsearch", source_url="u2"),
        ])
        supabase.select_responses["resumes"] = [[{"id": _RESUME_ID, "status": "processed"}]]
        supabase.select_responses["user_skills"] = [[{"skill_name": "Python"}]]
        with patch(
            "app.job_intelligence.services.job_service.score_job",
            return_value=_SCORE_RESULT,
        ):
            job_service.search_and_match(
                user_id=_USER_ID,
                resume_id=_RESUME_ID,
                query="python",
                location=None,
                source=source,
                supabase=supabase,
            )

        match_upserts = [u for u in supabase.upserts if u[0] == "job_matches"]
        assert len(match_upserts) == 1
        _, payload, opts = match_upserts[0]
        assert isinstance(payload, list)
        assert len(payload) == 2
        assert opts["on_conflict"] == "user_id,job_id,resume_id"
        first = payload[0]
        assert first["user_id"] == _USER_ID
        assert first["resume_id"] == _RESUME_ID
        assert first["fit_score"] == 75.50
        assert first["matched_skills"] == ["Python"]

    def test_returns_results_sorted_by_fit_score_desc(self, supabase):
        source = _fake_source([
            JobCreate(title="A", description="x", source="jsearch", source_url="ua"),
            JobCreate(title="B", description="y", source="jsearch", source_url="ub"),
        ])
        supabase.select_responses["resumes"] = [[{"id": _RESUME_ID, "status": "processed"}]]
        supabase.select_responses["user_skills"] = [[{"skill_name": "Python"}]]
        scores = iter([
            {**_SCORE_RESULT, "fit_score": 40.0},
            {**_SCORE_RESULT, "fit_score": 88.0},
        ])
        with patch(
            "app.job_intelligence.services.job_service.score_job",
            side_effect=lambda **_: next(scores),
        ):
            result = job_service.search_and_match(
                user_id=_USER_ID,
                resume_id=_RESUME_ID,
                query="python",
                location=None,
                source=source,
                supabase=supabase,
            )

        fit_scores = [m["fit_score"] for m in result["matches"]]
        assert fit_scores == sorted(fit_scores, reverse=True)
        assert result["search_id"] is not None

    def test_empty_search_results_returns_empty_matches(self, supabase):
        source = _fake_source([])
        supabase.select_responses["resumes"] = [[{"id": _RESUME_ID, "status": "processed"}]]
        supabase.select_responses["user_skills"] = [[{"skill_name": "Python"}]]
        result = job_service.search_and_match(
            user_id=_USER_ID,
            resume_id=_RESUME_ID,
            query="zzz",
            location=None,
            source=source,
            supabase=supabase,
        )
        assert result["matches"] == []
        # search row still persisted so user has history
        assert any(name == "job_searches" for name, _ in supabase.inserts)


class TestSaveToTracker:
    def test_inserts_application_with_job_and_match_ids(self, supabase):
        # Existing match lookup returns a row
        supabase.select_responses["job_matches"] = [[
            {
                "id": _MATCH_ID,
                "user_id": _USER_ID,
                "job_id": _JOB_ID,
                "resume_id": _RESUME_ID,
                "fit_score": 75.5,
                "missing_skills": ["Go"],
                "jobs": {
                    "title": "Backend Engineer",
                    "company": "Acme",
                    "location": "Berlin",
                    "deadline": None,
                },
            },
        ]]
        supabase.select_responses["applications"] = [[]]
        application = job_service.save_to_tracker(
            user_id=_USER_ID,
            match_id=_MATCH_ID,
            supabase=supabase,
        )

        inserted = next(payload for name, payload in supabase.inserts if name == "applications")
        assert inserted["user_id"] == _USER_ID
        assert inserted["job_id"] == _JOB_ID
        assert inserted["job_match_id"] == _MATCH_ID
        assert inserted["status"] == "saved"
        assert inserted["manual_job_title"] == "Backend Engineer"
        assert inserted["manual_company"] == "Acme"
        assert application["id"] == "applications-id-0"
        assert application["already_saved"] is False

    def test_existing_application_returns_already_saved(self, supabase):
        supabase.select_responses["job_matches"] = [[
            {
                "id": _MATCH_ID,
                "user_id": _USER_ID,
                "job_id": _JOB_ID,
                "resume_id": _RESUME_ID,
                "fit_score": 75.5,
                "missing_skills": [],
                "jobs": {"title": "Backend Engineer", "company": "Acme", "location": None, "deadline": None},
            },
        ]]
        supabase.select_responses["applications"] = [[
            {"id": "app-existing", "user_id": _USER_ID, "job_id": _JOB_ID, "status": "saved"},
        ]]
        result = job_service.save_to_tracker(
            user_id=_USER_ID,
            match_id=_MATCH_ID,
            supabase=supabase,
        )
        assert result["already_saved"] is True
        assert result["id"] == "app-existing"
        assert not any(name == "applications" for name, _ in supabase.inserts)

    def test_validate_resume_for_scoring_requires_processed(self, supabase):
        supabase.select_responses["resumes"] = [[
            {"id": _RESUME_ID, "status": "processing"},
        ]]
        with pytest.raises(ValueError, match="Upload and process"):
            job_service.validate_resume_for_scoring(
                user_id=_USER_ID,
                resume_id=_RESUME_ID,
                supabase=supabase,
            )

    def test_unknown_match_raises_404(self, supabase):
        supabase.select_responses["job_matches"] = [[]]
        with pytest.raises(Exception) as excinfo:
            job_service.save_to_tracker(
                user_id=_USER_ID,
                match_id=_MATCH_ID,
                supabase=supabase,
            )
        assert "404" in str(excinfo.value) or "not found" in str(excinfo.value).lower()
