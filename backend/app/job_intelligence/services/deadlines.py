"""Deadline parsing helpers for job postings."""
from __future__ import annotations

import re
from datetime import date, datetime, timezone
from typing import Any


_MONTHS = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}

_DEADLINE_KEYS = (
    "job_offer_expiration_datetime_utc",
    "job_offer_expiration_date",
    "job_offer_expiration_timestamp",
    "job_offer_expiration",
    "job_apply_deadline",
    "application_deadline",
    "apply_deadline",
    "deadline",
    "closing_date",
    "close_date",
    "expires_at",
    "expires",
)

_ISO_DATE_RE = re.compile(r"\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b")
_US_DATE_RE = re.compile(r"\b(0?[1-9]|1[0-2])[/](0?[1-9]|[12]\d|3[01])[/](20\d{2})\b")
_MONTH_DATE_RE = re.compile(
    r"\b("
    r"jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|"
    r"jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?"
    r")\.?\s+([0-9]{1,2})(?:st|nd|rd|th)?(?:,\s*(20\d{2}))?\b",
    re.IGNORECASE,
)
_CONTEXT_RE = re.compile(
    r"(apply by|deadline|closing date|closes on|applications? close|apply before|expires?)",
    re.IGNORECASE,
)


def parse_deadline_from_job_data(raw_data: dict[str, Any], text: str | None = None) -> date | None:
    """Return a trustworthy application deadline when one can be inferred."""
    for key in _DEADLINE_KEYS:
        parsed = parse_deadline_value(raw_data.get(key))
        if parsed:
            return parsed
    return parse_deadline_text(text or "")


def parse_deadline_value(value: Any) -> date | None:
    """Parse a raw upstream deadline value into a date."""
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, (int, float)):
        try:
            timestamp = float(value)
            if timestamp > 10_000_000_000:
                timestamp = timestamp / 1000
            return datetime.fromtimestamp(timestamp, tz=timezone.utc).date()
        except (OSError, OverflowError, ValueError):
            return None

    value_text = str(value).strip()
    if not value_text:
        return None

    iso_prefix = value_text[:10]
    try:
        return date.fromisoformat(iso_prefix)
    except ValueError:
        pass

    parsed = parse_deadline_text(value_text, require_context=False)
    return parsed


def parse_deadline_text(text: str, *, require_context: bool = True) -> date | None:
    """Extract a deadline from JD text when deadline wording is nearby."""
    if not text.strip():
        return None

    for match in _ISO_DATE_RE.finditer(text):
        if not require_context or _has_deadline_context(text, match.start()):
            return _safe_date(int(match.group(1)), int(match.group(2)), int(match.group(3)))

    for match in _US_DATE_RE.finditer(text):
        if not require_context or _has_deadline_context(text, match.start()):
            return _safe_date(int(match.group(3)), int(match.group(1)), int(match.group(2)))

    current_year = date.today().year
    for match in _MONTH_DATE_RE.finditer(text):
        if require_context and not _has_deadline_context(text, match.start()):
            continue
        month = _MONTHS.get(match.group(1).lower().rstrip("."))
        if not month:
            continue
        year = int(match.group(3) or current_year)
        parsed = _safe_date(year, month, int(match.group(2)))
        if parsed and not match.group(3) and parsed < date.today():
            parsed = _safe_date(year + 1, month, int(match.group(2)))
        if parsed:
            return parsed
    return None


def _has_deadline_context(text: str, index: int) -> bool:
    window = text[max(0, index - 80): min(len(text), index + 80)]
    return bool(_CONTEXT_RE.search(window))


def _safe_date(year: int, month: int, day: int) -> date | None:
    try:
        return date(year, month, day)
    except ValueError:
        return None
