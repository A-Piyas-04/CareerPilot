"""JSearch (RapidAPI) job source adapter.

Endpoint: GET {JSEARCH_BASE_URL}/search?query=...&num_pages=N
Docs:     https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
"""
from __future__ import annotations

import math
from typing import Any

import httpx

from app.job_intelligence.models.job import JobCreate
from app.job_intelligence.services.sources.jsearch_errors import JSearchError

_TIMEOUT_SECONDS = 15.0
_JSEARCH_SUBSCRIBE_URL = (
    "https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch/pricing"
)


def _raise_for_upstream_error(response: httpx.Response) -> None:
    """Map RapidAPI HTTP errors to actionable JSearchError messages."""
    status = response.status_code
    try:
        body = response.json()
        upstream_message = body.get("message", "") if isinstance(body, dict) else ""
    except ValueError:
        upstream_message = response.text[:200]

    if status == 403 and "not subscribed" in upstream_message.lower():
        raise JSearchError(
            "Your RapidAPI account is not subscribed to JSearch. "
            f"Open {_JSEARCH_SUBSCRIBE_URL}, choose a plan (Basic is free), "
            "subscribe with the same account that owns your JSEARCH_API_KEY, "
            "then restart the backend container.",
            status_code=403,
        )
    if status in (401, 403):
        raise JSearchError(
            "JSearch rejected the API key. Confirm JSEARCH_API_KEY in backend/.env "
            "matches the key shown on your RapidAPI JSearch app dashboard, "
            "and that you are subscribed to the API.",
            status_code=status,
        )
    if status == 429:
        raise JSearchError(
            "JSearch rate limit exceeded. Wait a moment or upgrade your RapidAPI plan.",
            status_code=429,
        )

    detail = upstream_message or response.text[:200] or "Unknown upstream error"
    raise JSearchError(
        f"JSearch upstream returned {status}: {detail}",
        status_code=502,
    )


class JSearchAdapter:
    """Fetch normalized job postings from the JSearch RapidAPI endpoint."""

    name: str = "jsearch"

    def __init__(
        self,
        *,
        api_key: str,
        host: str,
        base_url: str | None = None,
    ) -> None:
        self._api_key = api_key
        self._host = host
        self._base_url = (base_url or f"https://{host}").rstrip("/")

    def search(
        self,
        query: str,
        location: str | None = None,
        limit: int = 10,
    ) -> list[JobCreate]:
        if not self._api_key:
            raise ValueError(
                "JSEARCH_API_KEY is not configured; set it in backend/.env to use JSearch."
            )

        full_query = f"{query} in {location}" if location else query
        url = f"{self._base_url}/search"
        headers = {
            "x-rapidapi-key": self._api_key,
            "x-rapidapi-host": self._host,
        }
        num_pages = max(1, min(3, math.ceil(limit / 10)))
        params = {"query": full_query, "num_pages": str(num_pages)}

        with httpx.Client(timeout=_TIMEOUT_SECONDS) as client:
            response = client.get(url, headers=headers, params=params)

        if response.status_code >= 400:
            _raise_for_upstream_error(response)

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
