"""Resume analysis provider interfaces."""
from __future__ import annotations

from typing import Protocol


class ResumeAnalysisProvider(Protocol):
    """Provider contract for CV analysis outputs."""

    def extract_skills(self, text: str) -> list[dict]:
        """Extract normalized skills from resume text."""

