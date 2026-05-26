"""Shared Supabase response helpers for cv_intelligence services."""
from typing import Any


def _rows(response: Any) -> list[dict[str, Any]]:
    """Extract a list of row dicts from a Supabase response."""
    data = getattr(response, "data", None)
    if data is None and isinstance(response, dict):
        data = response.get("data")
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        return [data]
    return []


def _row(response: Any) -> dict[str, Any] | None:
    """Extract the first row dict from a Supabase response, or None."""
    rows = _rows(response)
    return rows[0] if rows else None
