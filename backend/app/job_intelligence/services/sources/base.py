"""JobSource adapter Protocol.

A JobSource produces normalized JobCreate records from some upstream provider.
Implementations should never raise for "no results" — return an empty list.
They MUST raise (ValueError / RuntimeError / HTTPException) for upstream errors
so the caller can surface them rather than treating an outage as zero matches.
"""
from __future__ import annotations

from typing import Protocol

from app.job_intelligence.models.job import JobCreate


class JobSource(Protocol):
    """Adapter for an external job-listing provider."""

    name: str

    def search(
        self,
        query: str,
        location: str | None = None,
        limit: int = 10,
    ) -> list[JobCreate]:
        """Return up to `limit` normalized job postings for the query."""
        ...
