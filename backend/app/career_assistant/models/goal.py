"""Goal model - Career goals."""
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, model_validator

from app.core.enums import GoalStatus as GoalStatusEnum


class GoalBase(BaseModel):
    """Base goal fields."""
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None

    @model_validator(mode="after")
    def trim_goal_fields(self) -> "GoalBase":
        self.title = self.title.strip()
        if not self.title:
            raise ValueError("Goal title cannot be blank")
        self.description = self.description.strip() if self.description else None
        return self


class GoalCreate(GoalBase):
    """Goal creation schema."""
    status: GoalStatusEnum = GoalStatusEnum.ACTIVE
    target_date: Optional[date] = None


class GoalUpdate(BaseModel):
    """Goal update schema."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[GoalStatusEnum] = None
    target_date: Optional[date] = None


class Goal(GoalBase):
    """Full goal model."""
    id: str
    user_id: str
    status: GoalStatusEnum
    target_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GoalDetail(Goal):
    """Goal model with linked tasks."""
    tasks: list["Task"] = Field(default_factory=list)


from app.career_assistant.models.task import Task

GoalDetail.model_rebuild()
