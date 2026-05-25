"""Roadmap item model - Individual roadmap steps."""
from datetime import datetime, date
from typing import Optional, Any
from pydantic import BaseModel, Field

from app.core.enums import TaskStatus as TaskStatusEnum


class RoadmapItemBase(BaseModel):
    """Base roadmap item fields."""
    week_number: Optional[int] = None
    title: str
    description: Optional[str] = None
    resources: list[dict[str, Any]] = Field(default_factory=list)


class RoadmapItemCreate(RoadmapItemBase):
    """Roadmap item creation schema."""
    roadmap_id: str
    user_id: str
    status: TaskStatusEnum = TaskStatusEnum.TODO
    due_date: Optional[date] = None


class RoadmapItemUpdate(BaseModel):
    """Roadmap item update schema."""
    week_number: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    resources: Optional[list[dict[str, Any]]] = None
    status: Optional[TaskStatusEnum] = None
    due_date: Optional[date] = None
    completed_at: Optional[datetime] = None


class RoadmapItem(RoadmapItemBase):
    """Full roadmap item model."""
    id: str
    roadmap_id: str
    user_id: str
    status: TaskStatusEnum
    due_date: Optional[date] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True