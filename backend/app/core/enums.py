"""Shared enums for database types."""
from enum import Enum


class ResumeStatus(str, Enum):
    """Resume processing status enum."""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class ApplicationStatus(str, Enum):
    """Application tracking status enum."""
    SAVED = "saved"
    APPLIED = "applied"
    INTERVIEWING = "interviewing"
    OFFER = "offer"
    REJECTED = "rejected"


class TaskStatus(str, Enum):
    """Task status enum."""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    CANCELLED = "cancelled"


class GoalStatus(str, Enum):
    """Goal status enum."""
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class MessageRole(str, Enum):
    """Chat message role enum."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class EventType(str, Enum):
    """Calendar event type enum."""
    DEADLINE = "deadline"
    INTERVIEW = "interview"
    REMINDER = "reminder"
    STUDY = "study"
    APPLICATION = "application"
    CUSTOM = "custom"