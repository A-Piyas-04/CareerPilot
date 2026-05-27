"""Profile ORM entity."""
import uuid

from sqlalchemy import Column, ForeignKey, Index, Table, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.core.orm.base import TimestampMixin


# Phantom reference to Supabase's auth.users table so the
# profiles.id -> auth.users.id foreign key can resolve in metadata.
# The env.py include_object hook filters non-public schemas out of
# autogenerate, so Alembic never tries to create or alter this.
auth_users = Table(
    "users",
    Base.metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    schema="auth",
)


class Profile(Base, TimestampMixin):
    __tablename__ = "profiles"
    __table_args__ = (
        Index("idx_profiles_email", "email"),
        Index("idx_profiles_target_role", "target_role"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    full_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    email: Mapped[str | None] = mapped_column(Text, nullable=True, unique=True)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_role: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(Text, nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
