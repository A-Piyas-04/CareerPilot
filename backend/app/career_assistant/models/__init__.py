"""Career Assistant models package."""
from app.career_assistant.models.application import (
    Application,
    ApplicationCreate,
    ApplicationDetail,
    ApplicationStatusUpdate,
    ApplicationUpdate,
)
from app.career_assistant.models.application_history import ApplicationHistory, ApplicationHistoryCreate
from app.career_assistant.models.assistant_conversation import AssistantConversation, AssistantConversationCreate, AssistantConversationUpdate
from app.career_assistant.models.assistant_message import AssistantMessage, AssistantMessageCreate
from app.career_assistant.models.cover_letter import CoverLetter, CoverLetterCreate, CoverLetterUpdate
from app.career_assistant.models.roadmap import Roadmap, RoadmapCreate, RoadmapUpdate
from app.career_assistant.models.roadmap_item import RoadmapItem, RoadmapItemCreate, RoadmapItemUpdate
from app.career_assistant.models.goal import Goal, GoalCreate, GoalUpdate
from app.career_assistant.models.task import Task, TaskCreate, TaskUpdate
from app.career_assistant.models.calendar_event import CalendarEvent, CalendarEventCreate, CalendarEventUpdate
from app.career_assistant.models.skill_gap_analysis import SkillGapAnalysis, SkillGapAnalysisCreate, SkillGapAnalysisUpdate
from app.core.enums import ApplicationStatus, EventType, GoalStatus, MessageRole, TaskStatus

__all__ = [
    "Application",
    "ApplicationCreate",
    "ApplicationDetail",
    "ApplicationStatusUpdate",
    "ApplicationUpdate",
    "ApplicationStatus",
    "ApplicationHistory",
    "ApplicationHistoryCreate",
    "AssistantConversation",
    "AssistantConversationCreate",
    "AssistantConversationUpdate",
    "AssistantMessage",
    "AssistantMessageCreate",
    "MessageRole",
    "CoverLetter",
    "CoverLetterCreate",
    "CoverLetterUpdate",
    "Roadmap",
    "RoadmapCreate",
    "RoadmapUpdate",
    "RoadmapItem",
    "RoadmapItemCreate",
    "RoadmapItemUpdate",
    "TaskStatus",
    "Goal",
    "GoalCreate",
    "GoalUpdate",
    "GoalStatus",
    "Task",
    "TaskCreate",
    "TaskUpdate",
    "CalendarEvent",
    "CalendarEventCreate",
    "CalendarEventUpdate",
    "EventType",
    "SkillGapAnalysis",
    "SkillGapAnalysisCreate",
    "SkillGapAnalysisUpdate",
]
