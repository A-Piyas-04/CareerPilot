"""Calendar event model - Events, deadlines, reminders."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.core.enums import EventType as EventTypeEnum


class CalendarEventBase(BaseModel):
    """Base calendar event fields."""
    title: str
    description: Optional[str] = None
    event_type: EventTypeEnum


class CalendarEventCreate(CalendarEventBase):
    """Calendar event creation schema."""
    user_id: str
    task_id: Optional[str] = None
    application_id: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    reminder_time: Optional[datetime] = None


class CalendarEventUpdate(BaseModel):
    """Calendar event update schema."""
    task_id: Optional[str] = None
    application_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[EventTypeEnum] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    reminder_time: Optional[datetime] = None


class CalendarEvent(CalendarEventBase):
    """Full calendar event model."""
    id: str
    user_id: str
    task_id: Optional[str] = None
    application_id: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    reminder_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True