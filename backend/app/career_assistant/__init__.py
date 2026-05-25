"""Career Assistant module - Member 3.

Handles AI chat, cover letters, roadmaps, calendar, Kanban, dashboard, and reminders.
"""
from app.career_assistant.models import (
    Application,
    ApplicationHistory,
    AssistantConversation,
    AssistantMessage,
    CoverLetter,
    Roadmap,
    RoadmapItem,
    Goal,
    Task,
    CalendarEvent,
    SkillGapAnalysis,
)

__all__ = [
    "Application",
    "ApplicationHistory",
    "AssistantConversation",
    "AssistantMessage",
    "CoverLetter",
    "Roadmap",
    "RoadmapItem",
    "Goal",
    "Task",
    "CalendarEvent",
    "SkillGapAnalysis",
]