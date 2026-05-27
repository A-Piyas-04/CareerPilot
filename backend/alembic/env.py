"""Alembic environment for CareerPilot.

Wires async SQLAlchemy to Alembic and registers every ORM entity
in ``Base.metadata`` so autogenerate can compare against the live
Supabase schema.
"""
import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

from app.core.db import Base, DATABASE_URL

# Importing the orm package triggers registration of every entity
# module against ``Base.metadata``.
import app.core.orm  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


# Tables that live in non-public Postgres schemas (Supabase auth,
# storage, etc.) should never be touched by Alembic autogenerate.
_IGNORED_SCHEMAS = {"auth", "storage", "graphql", "graphql_public", "realtime", "extensions", "pgsodium", "pgsodium_masks", "vault", "supabase_functions"}


def _include_object(object_, name, type_, reflected, compare_to):
    """Skip any DB object that lives outside the public schema."""
    if type_ == "table":
        schema = getattr(object_, "schema", None)
        if schema and schema in _IGNORED_SCHEMAS:
            return False
    return True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=_include_object,
        compare_type=True,
        compare_server_default=False,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        include_object=_include_object,
        compare_type=True,
        compare_server_default=False,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Create an async engine and run migrations through it."""
    connectable = create_async_engine(
        DATABASE_URL,
        poolclass=pool.NullPool,
        future=True,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
