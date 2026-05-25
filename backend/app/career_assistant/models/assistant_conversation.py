"""Assistant conversation model - AI chat sessions."""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


class AssistantConversationBase(BaseModel):
    """Base assistant conversation fields."""
    title: Optional[str] = None
    context: dict[str, Any] = Field(default_factory=dict)


class AssistantConversationCreate(AssistantConversationBase):
    """Assistant conversation creation schema."""
    user_id: str


class AssistantConversationUpdate(BaseModel):
    """Assistant conversation update schema."""
    title: Optional[str] = None
    context: Optional[dict[str, Any]] = None


class AssistantConversation(AssistantConversationBase):
    """Full assistant conversation model."""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True