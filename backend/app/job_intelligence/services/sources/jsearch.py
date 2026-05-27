"""JSearch (RapidAPI) job source adapter.

Endpoint: GET https://{host}/search?query=...&num_pages=1
Docs:     https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
"""
from __future__ import annotations

from typing import Any

import httpx

from app.job_intelligence.models.job import JobCreate

_TIMEOUT_SECONDS = 15.0


class JSearchAdapter:
    """Fetch normalized job postings from the JSearch RapidAPI endpoint."""

    name: str = "jsearch"

    def __init__(self, *, api_key: str, host: str) -> None:
        self._api_key = api_key
        self._host = host

    def search(
        self,
        query: str,
        location: str | None = None,
        limit: int = 10,
    ) -> list[JobCreate]:
        if not self._api_key:
            raise ValueError(
                "RAPIDAPI_KEY is not configured; set it in backend/.env to use JSearch."
            )

        full_query = f"{query} in {location}" if location else query
        url = f"https://{self._host}/search"
        headers = {
            "x-rapidapi-key": self._api_key,
            "x-rapidapi-host": self._host,
        }
        params = {"query": full_query, "num_pages": "1"}

        with httpx.Client(timeout=_TIMEOUT_SECONDS) as client:
            response = client.get(url, headers=headers, params=params)

        if response.status_code >= 400:
            raise RuntimeError(
                f"JSearch upstream returned {response.status_code}: "
                f"{response.text[:200]}"
            )

        payload = response.json() or {}
        raw_jobs = payload.get("data") or []
        return [self._to_jobcreate(item) for item in raw_jobs[:limit]]

    @staticmethod
    def _to_jobcreate(item: dict[str, Any]) -> JobCreate:
        city = item.get("job_city")
        country = item.get("job_country")
        if city and country:
            location = f"{city}, {country}"
        elif city:
            location = city
        elif country:
            location = country
        else:
            location = None

        salary_range: str | None
        smin = item.get("job_min_salary")
        smax = item.get("job_max_salary")
        currency = item.get("job_salary_currency")
        period = item.get("job_salary_period")
        if smin and smax and currency and period:
            salary_range = f"{smin}-{smax} {currency}/{period}"
        else:
            salary_range = None

        return JobCreate(
            title=item.get("job_title") or "Untitled",
            company=item.get("employer_name"),
            location=location,
            salary_range=salary_range,
            job_type=item.get("job_employment_type"),
            description=item.get("job_description"),
            requirements=None,
            source="jsearch",
            source_url=item.get("job_apply_link"),
            raw_data=item,
        )
