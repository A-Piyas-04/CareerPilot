"""ORM entity registry.

Importing this package imports every entity module so that
``Base.metadata`` is fully populated for Alembic autogeneration.
"""
from app.core.db import Base
from app.core.orm import (
    base,
    career_assistant,
    cv_intelligence,
    evaluation,
    job_intelligence,
    profile,
)

__all__ = [
    "Base",
    "base",
    "career_assistant",
    "cv_intelligence",
    "evaluation",
    "job_intelligence",
    "profile",
]
