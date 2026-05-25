"""Assistant message model - Individual chat messages."""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field

from app.core.enums import MessageRole as MessageRoleEnum


class AssistantMessageBase(BaseModel):
    """Base assistant message fields."""
    content: str


class AssistantMessageCreate(AssistantMessageBase):
    """Assistant message creation schema."""
    conversation_id: str
    user_id: str
    role: MessageRoleEnum
    used_resume_chunks: list[str] = Field(default_factory=list)
    used_job_id: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class AssistantMessage(AssistantMessageBase):
    """Full assistant message model."""
    id: str
    conversation_id: str
    user_id: str
    role: MessageRoleEnum
    used_resume_chunks: list[str] = Field(default_factory=list)
    used_job_id: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    class Config:
        from_attributes = True