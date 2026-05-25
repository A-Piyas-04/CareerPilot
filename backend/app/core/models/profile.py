"""Profile model - User identity and profile data."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProfileBase(BaseModel):
    """Base profile fields."""
    full_name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    target_role: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None


class ProfileCreate(ProfileBase):
    """Profile creation schema."""
    pass


class ProfileUpdate(BaseModel):
    """Profile update schema - all fields optional."""
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    target_role: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None


class Profile(ProfileBase):
    """Full profile model with timestamps."""
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True