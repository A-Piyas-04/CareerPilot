"""Tests for JSearchAdapter — RapidAPI JSearch HTTP client."""
from unittest.mock import MagicMock, patch

import pytest

from app.job_intelligence.services.sources.jsearch import JSearchAdapter


_SAMPLE_RESPONSE = {
    "status": "OK",
    "data": [
        {
            "job_id": "abc123",
            "job_title": "Senior Backend Engineer",
            "employer_name": "Acme Corp",
            "job_city": "Berlin",
            "job_country": "DE",
            "job_employment_type": "FULLTIME",
            "job_description": "Build distributed Python services.",
            "job_apply_link": "https://acme.example.com/jobs/abc123",
            "job_min_salary": 70000,
            "job_max_salary": 95000,
            "job_salary_currency": "EUR",
            "job_salary_period": "YEAR",
        },
        {
            "job_id": "def456",
            "job_title": "Platform Engineer",
            "employer_name": "Beta Inc",
            "job_city": None,
            "job_country": "DE",
            "job_employment_type": "FULLTIME",
            "job_description": "Kubernetes + Terraform.",
            "job_apply_link": "https://beta.example.com/jobs/def456",
        },
    ],
}


def _make_response(status_code: int = 200, json_data: dict | None = None):
    response = MagicMock()
    response.status_code = status_code
    response.json.return_value = json_data if json_data is not None else _SAMPLE_RESPONSE
    response.text = "upstream error" if status_code >= 400 else ""
    return response


class TestJSearchAdapter:
    def test_name_attribute(self):
        adapter = JSearchAdapter(api_key="k", host="h")
        assert adapter.name == "jsearch"

    def test_missing_api_key_raises(self):
        with pytest.raises(ValueError, match="RAPIDAPI_KEY"):
            JSearchAdapter(api_key="", host="jsearch.p.rapidapi.com").search("python")

    def test_search_calls_correct_url_and_headers(self):
        adapter = JSearchAdapter(api_key="k", host="jsearch.p.rapidapi.com")
        with patch("app.job_intelligence.services.sources.jsearch.httpx.Client") as client_cls:
            client = client_cls.return_value.__enter__.return_value
            client.get.return_value = _make_response()
            adapter.search("python developer", location="Berlin", limit=5)

        call = client.get.call_args
        assert call.args[0] == "https://jsearch.p.rapidapi.com/search"
        headers = call.kwargs["headers"]
        assert headers["x-rapidapi-key"] == "k"
        assert headers["x-rapidapi-host"] == "jsearch.p.rapidapi.com"
        params = call.kwargs["params"]
        assert params["query"] == "python developer in Berlin"
        assert params["num_pages"] == "1"

    def test_search_without_location(self):
        adapter = JSearchAdapter(api_key="k", host="jsearch.p.rapidapi.com")
        with patch("app.job_intelligence.services.sources.jsearch.httpx.Client") as client_cls:
            client = client_cls.return_value.__enter__.return_value
            client.get.return_value = _make_response()
            adapter.search("python developer")
        assert client.get.call_args.kwargs["params"]["query"] == "python developer"

    def test_search_returns_jobcreates(self):
        adapter = JSearchAdapter(api_key="k", host="jsearch.p.rapidapi.com")
        with patch("app.job_intelligence.services.sources.jsearch.httpx.Client") as client_cls:
            client = client_cls.return_value.__enter__.return_value
            client.get.return_value = _make_response()
            results = adapter.search("python", limit=2)
        assert len(results) == 2
        first = results[0]
        assert first.title == "Senior Backend Engineer"
        assert first.company == "Acme Corp"
        assert first.location == "Berlin, DE"
        assert first.job_type == "FULLTIME"
        assert first.source == "jsearch"
        assert first.source_url == "https://acme.example.com/jobs/abc123"
        assert first.description == "Build distributed Python services."
        assert first.salary_range == "70000-95000 EUR/YEAR"
        # raw_data preserves the upstream payload for later debugging
        assert first.raw_data["job_id"] == "abc123"

    def test_search_handles_missing_optional_fields(self):
        adapter = JSearchAdapter(api_key="k", host="jsearch.p.rapidapi.com")
        with patch("app.job_intelligence.services.sources.jsearch.httpx.Client") as client_cls:
            client = client_cls.return_value.__enter__.return_value
            client.get.return_value = _make_response()
            results = adapter.search("python", limit=5)
        second = results[1]
        assert second.location == "DE"  # no city
        assert second.salary_range is None

    def test_search_respects_limit(self):
        adapter = JSearchAdapter(api_key="k", host="jsearch.p.rapidapi.com")
        with patch("app.job_intelligence.services.sources.jsearch.httpx.Client") as client_cls:
            client = client_cls.return_value.__enter__.return_value
            client.get.return_value = _make_response()
            results = adapter.search("python", limit=1)
        assert len(results) == 1

    def test_search_raises_on_http_error(self):
        adapter = JSearchAdapter(api_key="k", host="jsearch.p.rapidapi.com")
        with patch("app.job_intelligence.services.sources.jsearch.httpx.Client") as client_cls:
            client = client_cls.return_value.__enter__.return_value
            client.get.return_value = _make_response(status_code=503, json_data={})
            with pytest.raises(RuntimeError, match="JSearch upstream"):
                adapter.search("python")

    def test_search_returns_empty_when_data_missing(self):
        adapter = JSearchAdapter(api_key="k", host="jsearch.p.rapidapi.com")
        with patch("app.job_intelligence.services.sources.jsearch.httpx.Client") as client_cls:
            client = client_cls.return_value.__enter__.return_value
            client.get.return_value = _make_response(json_data={"status": "OK", "data": []})
            assert adapter.search("python") == []
