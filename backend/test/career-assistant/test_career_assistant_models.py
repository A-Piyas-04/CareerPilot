"""Pydantic compatibility checks for Career Assistant features."""
from datetime import datetime, timezone

from app.career_assistant.models.calendar_event import CalendarEvent
from app.career_assistant.models.cover_letter import CoverLetter, CoverLetterCreate
from app.career_assistant.models.roadmap import Roadmap
from app.career_assistant.models.roadmap_item import RoadmapItem
from app.core.enums import EventType, TaskStatus


def test_calendar_event_model_supports_study_events_and_links():
    event = CalendarEvent(
        id="event",
        user_id="user",
        task_id="task",
        application_id=None,
        title="Study FastAPI",
        description=None,
        event_type=EventType.STUDY,
        start_time=datetime.now(timezone.utc),
        end_time=None,
        reminder_time=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    assert event.event_type == EventType.STUDY
    assert event.task_id == "task"


def test_roadmap_models_include_resume_id_and_item_updated_at():
    roadmap = Roadmap(
        id="roadmap",
        user_id="user",
        resume_id="resume",
        target_role="ML Engineer",
        duration_weeks=8,
        overview="Plan",
        progress_percent=12.5,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    item = RoadmapItem(
        id="item",
        roadmap_id="roadmap",
        user_id="user",
        week_number=1,
        title="Python ML basics",
        description="Deliver notebook",
        resources=[],
        status=TaskStatus.TODO,
        due_date=None,
        completed_at=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    assert roadmap.resume_id == "resume"
    assert item.updated_at is not None


def test_cover_letter_models_include_management_metadata():
    create = CoverLetterCreate(
        user_id="user",
        resume_id="resume",
        job_id="job",
        title="ML Engineer Intern at Acme",
        job_title="ML Engineer Intern",
        company_name="Acme",
        job_description="Python and REST APIs",
        tone="professional",
        extra_notes="Mention internship",
        content="Dear Hiring Manager...",
    )
    saved = CoverLetter(
        **create.model_dump(),
        id="letter",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    assert saved.job_title == "ML Engineer Intern"
    assert saved.company_name == "Acme"
    assert saved.version == 1
