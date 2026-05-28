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
    dim = int(os.getenv("EMBEDDING_VECTOR_DIM", "768"))
    op.execute("DROP INDEX IF EXISTS idx_resume_chunks_embedding;")
    op.execute(
        f"ALTER TABLE resume_chunks "
        f"ALTER COLUMN embedding TYPE vector({dim}) "
        f"USING embedding::vector({dim});"
    )
    op.execute(
        "CREATE INDEX idx_resume_chunks_embedding ON resume_chunks "
        "USING ivfflat (embedding vector_cosine_ops);"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_resume_chunks_embedding;")
    op.execute(
        "ALTER TABLE resume_chunks "
        "ALTER COLUMN embedding TYPE vector(384) "
        "USING embedding::vector(384);"
    )
    op.execute(
        "CREATE INDEX idx_resume_chunks_embedding ON resume_chunks "
        "USING ivfflat (embedding vector_cosine_ops);"
    )

