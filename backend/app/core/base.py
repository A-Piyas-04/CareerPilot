"""Base model classes with common functionality."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
import uuid


class TimestampMixin(BaseModel):
    """Mixin for timestamp fields."""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class UUIDModel(BaseModel):
    """Base model with UUID primary key."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class UserOwnedModel(BaseModel):
    """Base model with user_id ownership."""
    user_id: str