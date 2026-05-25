"""CV section detection — identify named sections from resume plain text."""
import re

# Maps canonical section name → list of heading aliases (all lowercase).
SECTION_HEADINGS: dict[str, list[str]] = {
    "summary": [
        "summary",
        "profile",
        "objective",
        "about me",
        "professional summary",
        "career summary",
        "professional profile",
        "personal statement",
    ],
    "experience": [
        "experience",
        "work experience",
        "employment",
        "work history",
        "professional experience",
        "career history",
        "job history",
        "employment history",
    ],
    "education": [
        "education",
        "academic background",
        "qualifications",
        "academic qualifications",
        "educational background",
        "academic history",
    ],
    "skills": [
        "skills",
        "technical skills",
        "core competencies",
        "technologies",
        "key skills",
        "competencies",
        "technical competencies",
        "tools and technologies",
        "programming languages",
    ],
    "projects": [
        "projects",
        "personal projects",
        "key projects",
        "notable projects",
        "side projects",
        "portfolio",
    ],
    "certifications": [
        "certifications",
        "certificates",
        "licenses",
        "credentials",
        "professional certifications",
    ],
    "achievements": [
        "achievements",
        "awards",
        "honors",
        "accomplishments",
        "recognition",
        "honours",
    ],
    "publications": [
        "publications",
        "research",
        "papers",
        "research papers",
    ],
    "languages": [
        "languages",
        "spoken languages",
        "language skills",
    ],
}

# Build a flat mapping: lowercase alias → canonical name (used for O(1) lookup)
_ALIAS_TO_CANONICAL: dict[str, str] = {
    alias: canonical
    for canonical, aliases in SECTION_HEADINGS.items()
    for alias in aliases
}

# Maximum line length to be considered a section heading (headings are short)
_MAX_HEADING_LEN = 60


def detect_sections(text: str) -> list[dict]:
    """
    Parse plain text into named CV sections.

    Returns a list of dicts with keys:
        section_name  (str)  — canonical name or original heading text
        content       (str)  — text belonging to that section
        section_order (int)  — 0-based position

    Falls back to a single "general" section when no headings are found.
    """
    lines = text.splitlines()
    # Each entry: (line_index, canonical_name)
    heading_positions: list[tuple[int, str]] = []

    for i, line in enumerate(lines):
        canonical = _match_heading(line)
        if canonical:
            heading_positions.append((i, canonical))

    if not heading_positions:
        return [{"section_name": "general", "content": text.strip(), "section_order": 0}]

    sections: list[dict] = []
    for order, (start_idx, name) in enumerate(heading_positions):
        # Content runs from the line after the heading to the line before the next heading
        end_idx = (
            heading_positions[order + 1][0]
            if order + 1 < len(heading_positions)
            else len(lines)
        )
        content_lines = lines[start_idx + 1 : end_idx]
        content = "\n".join(content_lines).strip()
        if content:
            sections.append(
                {"section_name": name, "content": content, "section_order": order}
            )

    # Edge case: all headings had empty content
    if not sections:
        return [{"section_name": "general", "content": text.strip(), "section_order": 0}]

    return sections


def _match_heading(line: str) -> str | None:
    """
    Return the canonical section name if the line looks like a CV section heading,
    otherwise return None.

    A heading candidate must be:
    - Non-empty after stripping
    - At most _MAX_HEADING_LEN characters
    - Uppercase, title-case, or match a known alias after cleaning
    """
    stripped = line.strip()
    if not stripped or len(stripped) > _MAX_HEADING_LEN:
        return None

    # Remove common decoration characters (dashes, underscores, colons, bullets)
    cleaned = re.sub(r"[:\-_•*#]+", " ", stripped).strip()
    normalised = cleaned.lower()

    # Direct alias match
    if normalised in _ALIAS_TO_CANONICAL:
        return _ALIAS_TO_CANONICAL[normalised]

    # All-caps check: e.g. "WORK EXPERIENCE" → "work experience"
    if stripped.isupper() and normalised in _ALIAS_TO_CANONICAL:
        return _ALIAS_TO_CANONICAL[normalised]

    # Check each alias for partial exact match at start (e.g. "Skills & Tools" → "skills")
    for alias, canonical in _ALIAS_TO_CANONICAL.items():
        if normalised.startswith(alias):
            return canonical

    return None
