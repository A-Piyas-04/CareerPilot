"""Task model - To-do items."""
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, model_validator

from app.core.enums import TaskStatus as TaskStatusEnum


class TaskBase(BaseModel):
    """Base task fields."""
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    priority: int = Field(default=2, ge=1, le=3)
    due_date: Optional[date] = None

    @model_validator(mode="after")
    def trim_task_fields(self) -> "TaskBase":
        self.title = self.title.strip()
        if not self.title:
            raise ValueError("Task title cannot be blank")
        self.description = self.description.strip() if self.description else None
        return self


class TaskCreate(TaskBase):
    """Task creation schema."""
    goal_id: Optional[str] = None
    roadmap_item_id: Optional[str] = None
    application_id: Optional[str] = None
    status: TaskStatusEnum = TaskStatusEnum.TODO


class TaskUpdate(BaseModel):
    """Task update schema."""
    goal_id: Optional[str] = None
    roadmap_item_id: Optional[str] = None
    application_id: Optional[str] = None
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[TaskStatusEnum] = None
    priority: Optional[int] = Field(default=None, ge=1, le=3)
    due_date: Optional[date] = None


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
