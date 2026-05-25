"""Task model - To-do items."""
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field

from app.core.enums import TaskStatus as TaskStatusEnum


class TaskBase(BaseModel):
    """Base task fields."""
    title: str
    description: Optional[str] = None
    priority: int = Field(default=1, ge=1, le=5)
    due_date: Optional[date] = None


class TaskCreate(TaskBase):
    """Task creation schema."""
    user_id: str
    goal_id: Optional[str] = None
    roadmap_item_id: Optional[str] = None
    application_id: Optional[str] = None
    status: TaskStatusEnum = TaskStatusEnum.TODO


class TaskUpdate(BaseModel):
    """Task update schema."""
    goal_id: Optional[str] = None
    roadmap_item_id: Optional[str] = None
    application_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatusEnum] = None
    priority: Optional[int] = None
    due_date: Optional[date] = None
    completed_at: Optional[datetime] = None


class Task(TaskBase):
    """Full task model."""
    id: str
    user_id: str
    goal_id: Optional[str] = None
    roadmap_item_id: Optional[str] = None
    application_id: Optional[str] = None
    status: TaskStatusEnum
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True