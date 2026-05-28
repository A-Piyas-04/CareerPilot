"""Career Assistant ORM entities."""
import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    ARRAY,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import ENUM, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.core.enums import (
    ApplicationStatus,
    EventType,
    GoalStatus,
    MessageRole,
    TaskStatus,
)
from app.core.orm.base import CreatedAtMixin, TimestampMixin


def _pg_enum(enum_cls, name: str) -> ENUM:
    return ENUM(
        enum_cls,
        name=name,
        values_callable=lambda cls: [m.value for m in cls],
        create_type=False,
    )


application_status_pg = _pg_enum(ApplicationStatus, "application_status")
task_status_pg = _pg_enum(TaskStatus, "task_status")
goal_status_pg = _pg_enum(GoalStatus, "goal_status")
message_role_pg = _pg_enum(MessageRole, "message_role")
event_type_pg = _pg_enum(EventType, "event_type")


class Application(Base, TimestampMixin):
    __tablename__ = "applications"
    __table_args__ = (
        CheckConstraint(
            "job_id is not null or nullif(btrim(manual_job_title), '') is not null",
            name="applications_has_job_or_manual_title",
        ),
        Index("idx_applications_user_id", "user_id"),
        Index("idx_applications_job_id", "job_id"),
        Index("idx_applications_status", "status"),
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
    job_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="SET NULL"),
        nullable=True,
    )
    job_match_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("job_matches.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[ApplicationStatus | None] = mapped_column(
        application_status_pg,
        nullable=True,
        server_default=text("'saved'::application_status"),
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    applied_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    manual_job_title: Mapped[str | None] = mapped_column(Text, nullable=True)
    manual_company: Mapped[str | None] = mapped_column(Text, nullable=True)
    manual_location: Mapped[str | None] = mapped_column(Text, nullable=True)


class ApplicationHistory(Base):
    __tablename__ = "application_history"
    __table_args__ = (
        Index("idx_application_history_application_id", "application_id"),
        Index("idx_application_history_changed_at", "changed_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
    )
    old_status: Mapped[ApplicationStatus | None] = mapped_column(
        application_status_pg, nullable=True
    )
    new_status: Mapped[ApplicationStatus] = mapped_column(
        application_status_pg, nullable=False
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=True,
    )


class AssistantConversation(Base, TimestampMixin):
    __tablename__ = "assistant_conversations"
    __table_args__ = (
        Index("idx_assistant_conversations_user_id", "user_id"),
        Index("idx_assistant_conversations_updated_at", "updated_at"),
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
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    context: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB, nullable=True, server_default=text("'{}'::jsonb")
    )


class AssistantMessage(Base, CreatedAtMixin):
    __tablename__ = "assistant_messages"
    __table_args__ = (
        Index("idx_assistant_messages_conversation_id", "conversation_id"),
        Index("idx_assistant_messages_user_id", "user_id"),
        Index("idx_assistant_messages_created_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assistant_conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[MessageRole] = mapped_column(message_role_pg, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    used_resume_chunks: Mapped[list[uuid.UUID] | None] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=True
    )
    used_job_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="SET NULL"),
        nullable=True,
    )
    metadata_: Mapped[dict[str, Any] | None] = mapped_column(
        "metadata",
        JSONB,
        nullable=True,
        server_default=text("'{}'::jsonb"),
    )


class CoverLetter(Base, TimestampMixin):
    __tablename__ = "cover_letters"
    __table_args__ = (
        Index("idx_cover_letters_user_id", "user_id"),
        Index("idx_cover_letters_resume_id", "resume_id"),
        Index("idx_cover_letters_job_id", "job_id"),
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
    job_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[int | None] = mapped_column(
        Integer, nullable=True, server_default=text("1")
    )


class Roadmap(Base, TimestampMixin):
    __tablename__ = "roadmaps"
    __table_args__ = (
        Index("idx_roadmaps_user_id", "user_id"),
        Index("idx_roadmaps_resume_id", "resume_id"),
        Index("idx_roadmaps_target_role", "target_role"),
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
    target_role: Mapped[str] = mapped_column(Text, nullable=False)
    duration_weeks: Mapped[int | None] = mapped_column(Integer, nullable=True)
    overview: Mapped[str | None] = mapped_column(Text, nullable=True)
    progress_percent: Mapped[float | None] = mapped_column(
        Numeric(5, 2), nullable=True, server_default=text("0")
    )


class RoadmapItem(Base, TimestampMixin):
    __tablename__ = "roadmap_items"
    __table_args__ = (
        Index("idx_roadmap_items_roadmap_id", "roadmap_id"),
        Index("idx_roadmap_items_user_id", "user_id"),
        Index("idx_roadmap_items_status", "status"),
        Index("idx_roadmap_items_week_number", "week_number"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    roadmap_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roadmaps.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    week_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    resources: Mapped[Any | None] = mapped_column(
        JSONB, nullable=True, server_default=text("'[]'::jsonb")
    )
    status: Mapped[TaskStatus | None] = mapped_column(
        task_status_pg,
        nullable=True,
        server_default=text("'todo'::task_status"),
    )
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class Goal(Base, TimestampMixin):
    __tablename__ = "goals"
    __table_args__ = (
        Index("idx_goals_user_id", "user_id"),
        Index("idx_goals_status", "status"),
        Index("idx_goals_target_date", "target_date"),
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
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[GoalStatus | None] = mapped_column(
        goal_status_pg,
        nullable=True,
        server_default=text("'active'::goal_status"),
    )
    target_date: Mapped[date | None] = mapped_column(Date, nullable=True)


class Task(Base, TimestampMixin):
    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint("priority between 1 and 3", name="tasks_priority_range"),
        Index("idx_tasks_user_id", "user_id"),
        Index("idx_tasks_goal_id", "goal_id"),
        Index("idx_tasks_status", "status"),
        Index("idx_tasks_priority", "priority"),
        Index("idx_tasks_due_date", "due_date"),
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
    goal_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("goals.id", ondelete="SET NULL"),
        nullable=True,
    )
    roadmap_item_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roadmap_items.id", ondelete="SET NULL"),
        nullable=True,
    )
    application_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[TaskStatus | None] = mapped_column(
        task_status_pg,
        nullable=True,
        server_default=text("'todo'::task_status"),
    )
    priority: Mapped[int | None] = mapped_column(
        Integer, nullable=True, server_default=text("1")
    )
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class CalendarEvent(Base, TimestampMixin):
    __tablename__ = "calendar_events"
    __table_args__ = (
        Index("idx_calendar_events_user_id", "user_id"),
        Index("idx_calendar_events_task_id", "task_id"),
        Index("idx_calendar_events_application_id", "application_id"),
        Index("idx_calendar_events_event_type", "event_type"),
        Index("idx_calendar_events_start_time", "start_time"),
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
    task_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="SET NULL"),
        nullable=True,
    )
    application_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_type: Mapped[EventType] = mapped_column(event_type_pg, nullable=False)
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    end_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    reminder_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class SkillGapAnalysis(Base, CreatedAtMixin):
    __tablename__ = "skill_gap_analysis"
    __table_args__ = (
        Index("idx_skill_gap_analysis_user_id", "user_id"),
        Index("idx_skill_gap_analysis_target_role", "target_role"),
        Index("idx_skill_gap_analysis_created_at", "created_at"),
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
    job_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="SET NULL"),
        nullable=True,
    )
    target_role: Mapped[str | None] = mapped_column(Text, nullable=True)
    current_skills: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    required_skills: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text), nullable=True
    )
    missing_skills: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    recommendations: Mapped[Any | None] = mapped_column(JSONB, nullable=True)
