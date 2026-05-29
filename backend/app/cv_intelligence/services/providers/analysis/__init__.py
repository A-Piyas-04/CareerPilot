"""Resume analysis provider factory."""
from __future__ import annotations

from app.core.config import settings
from app.cv_intelligence.services.providers.analysis.base import ResumeAnalysisProvider
from app.cv_intelligence.services.providers.analysis.gemini_resume_analysis import (
    GeminiResumeAnalysisProvider,
)


def get_analysis_provider() -> ResumeAnalysisProvider:
    """Return configured CV analysis provider."""
    backend = settings.analysis_backend.lower().strip()
    if backend == "gemini":
        return GeminiResumeAnalysisProvider()
    raise RuntimeError(
        f"Unsupported analysis backend '{backend}'. "
        "Set ANALYSIS_BACKEND=gemini."
    )

