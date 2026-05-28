"""Manual-paste job source: user supplies a single JD by hand."""
from __future__ import annotations

from app.job_intelligence.models.job import JobCreate


class ManualPasteAdapter:
    """Wraps a single user-pasted job posting as a JobCreate."""

    name: str = "manual"

    def parse(
        self,
        *,
        title: str,
        description: str,
        company: str | None = None,
        location: str | None = None,
        source_url: str | None = None,
    ) -> list[JobCreate]:
        """Validate the input and return a single JobCreate."""
        clean_title = (title or "").strip()
        if not clean_title:
            raise ValueError("title is required")
        clean_description = (description or "").strip()
        if not clean_description:
            raise ValueError("description is required")

        return [
            JobCreate(
                title=clean_title,
                description=clean_description,
                company=(company or "").strip() or None,
                location=(location or "").strip() or None,
                source="manual",
                source_url=source_url or None,
            )
        ]

    def search(
        self,
        query: str,
        location: str | None = None,
        limit: int = 10,
    ) -> list[JobCreate]:
        """ManualPasteAdapter does not support free-text search; returns []."""
        return []
