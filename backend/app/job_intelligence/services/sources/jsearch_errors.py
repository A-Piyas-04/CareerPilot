"""JSearch upstream error types."""
from __future__ import annotations


class JSearchError(Exception):
    """Raised when the JSearch/RapidAPI upstream returns an error."""

    def __init__(self, message: str, *, status_code: int = 502) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)
