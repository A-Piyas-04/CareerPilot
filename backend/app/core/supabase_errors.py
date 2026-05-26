"""Map Supabase/PostgREST errors to HTTP responses."""
from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

try:
    from postgrest.exceptions import APIError as PostgrestAPIError
except ImportError:  # pragma: no cover
    PostgrestAPIError = None  # type: ignore[misc, assignment]


def _error_fields(exc: Exception) -> tuple[str | None, str | None, str | None]:
    """Extract message, code, and hint from a PostgREST APIError."""
    message: str | None = None
    code: str | None = None
    hint: str | None = None

    if hasattr(exc, "message"):
        message = str(getattr(exc, "message"))
    if hasattr(exc, "code"):
        code = str(getattr(exc, "code"))

    raw = getattr(exc, "args", None)
    if raw and isinstance(raw[0], dict):
        payload: dict[str, Any] = raw[0]
        message = message or str(payload.get("message", ""))
        code = code or str(payload.get("code", "")) or None
        hint = str(payload.get("hint", "")) or None

    return message or str(exc), code, hint


def raise_http_for_supabase(exc: Exception, *, context: str) -> None:
    """
    Convert a Supabase/PostgREST failure into an HTTPException.

    Logs the full error server-side; returns a safe message to the client.
    """
    message, code, hint = _error_fields(exc)
    logger.exception("%s failed: %s (code=%s)", context, message, code)

    if code == "42501":
        detail = (
            "Database permission denied for CV tables. "
            "Apply Supabase migration 20250526120000_resume_cv_grants.sql "
            "(GRANT resumes, resume_sections, resume_chunks, user_skills to service_role)."
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
        ) from exc

    if code == "PGRST116":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found.",
        ) from exc

    detail = message or f"{context} failed."
    if hint and code not in ("42501",):
        detail = f"{detail} ({hint})"

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=detail,
    ) from exc


def run_supabase(context: str, fn: Any) -> Any:
    """Execute a Supabase call and map PostgREST APIError to HTTPException."""
    try:
        return fn()
    except Exception as exc:
        if PostgrestAPIError is not None and isinstance(exc, PostgrestAPIError):
            raise_http_for_supabase(exc, context=context)
        raise
