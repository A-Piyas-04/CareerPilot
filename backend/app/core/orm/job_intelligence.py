"""Job Intelligence ORM entities: job_searches, jobs, job_matches."""
import uuid
from datetime import date
from typing import Any

from sqlalchemy import (
    ARRAY,
    Date,
    ForeignKey,
    Index,
    Numeric,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.core.orm.base import CreatedAtMixin


class JobSearch(Base, CreatedAtMixin):
    __tablename__ = "job_searches"
    __table_args__ = (
        Index("idx_job_searches_user_id", "user_id"),
        Index("idx_job_searches_created_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    query: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str | None] = mapped_column(Text, nullable=True)
    filters: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB, nullable=True, server_default=text("'{}'::jsonb")
    )
    source: Mapped[str | None] = mapped_column(Text, nullable=True)


class Job(Base, CreatedAtMixin):
    __tablename__ = "jobs"
    __table_args__ = (
        Index("idx_jobs_search_id", "search_id"),
        Index("idx_jobs_title", "title"),
        Index("idx_jobs_company", "company"),
        Index("idx_jobs_location", "location"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    search_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("job_searches.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    company: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(Text, nullable=True)
    salary_range: Mapped[str | None] = mapped_column(Text, nullable=True)
    job_type: Mapped[str | None] = mapped_column(Text, nullable=True)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_data: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB, nullable=True, server_default=text("'{}'::jsonb")
    )


class JobMatch(Base, CreatedAtMixin):
    __tablename__ = "job_matches"
    __table_args__ = (
        UniqueConstraint("user_id", "job_id", "resume_id"),
        Index("idx_job_matches_user_id", "user_id"),
        Index("idx_job_matches_job_id", "job_id"),
        Index("idx_job_matches_resume_id", "resume_id"),
        Index("idx_job_matches_fit_score", "fit_score"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    resume_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resumes.id", ondelete="SET NULL"),
        nullable=True,
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
    )
    fit_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    matched_skills: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    missing_skills: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence_chunks: Mapped[list[uuid.UUID] | None] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=True
    )
