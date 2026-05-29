"""gemini_embedding_dimension_upgrade

Revision ID: 2b7f66d7a1b2
Revises: e97587feff9b
Create Date: 2026-05-28 13:20:00.000000
"""
from __future__ import annotations

import os
from typing import Sequence, Union

from alembic import op


revision: str = "2b7f66d7a1b2"
down_revision: Union[str, Sequence[str], None] = "e97587feff9b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    dim = int(os.getenv("EMBEDDING_VECTOR_DIM", "384"))
    op.execute(f"ALTER TABLE resume_chunks ADD COLUMN IF NOT EXISTS embedding_new vector({dim});")
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_resume_chunks_embedding_new ON resume_chunks "
        "USING ivfflat (embedding_new vector_cosine_ops);"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_resume_chunks_embedding_new;")
    op.execute("ALTER TABLE resume_chunks DROP COLUMN IF EXISTS embedding_new;")

