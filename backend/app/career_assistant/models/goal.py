"""Goal model - Career goals."""
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel

from app.core.enums import GoalStatus as GoalStatusEnum


class GoalBase(BaseModel):
    """Base goal fields."""
    title: str
    description: Optional[str] = None


class GoalCreate(GoalBase):
    """Goal creation schema."""
    user_id: str
    status: GoalStatusEnum = GoalStatusEnum.ACTIVE
    target_date: Optional[date] = None


class GoalUpdate(BaseModel):
    """Goal update schema."""
    title: Optional[str] = None
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