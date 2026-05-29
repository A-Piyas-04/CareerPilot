"""Startup validation for embedding / pgvector configuration."""
from __future__ import annotations

import logging
import re
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

_VECTOR_DIM_RE = re.compile(r"vector\((\d+)\)")


def get_embedding_config_summary() -> dict[str, Any]:
    """Return current embedding configuration for /health and logging."""
    column = settings.embedding_active_column.strip() or "embedding"
    use_rpc = column == "embedding"
    return {
        "provider": settings.embedding_backend,
        "vector_dim": settings.embedding_vector_dim,
        "active_column": column,
        "retrieval_require_dim_match": settings.retrieval_require_dim_match,
        "retrieval_strategy": "rpc_then_numpy_fallback" if use_rpc else "numpy_fallback_only",
        "rpc_available": None,
        "db_column_dim": None,
        "validation_ok": None,
        "validation_message": None,
    }


def validate_embedding_config_at_startup(*, strict: bool = True) -> dict[str, Any]:
    """
    Verify configured embedding dimension matches the database column and RPC.

    When strict=True and DATABASE_URL is set, raises RuntimeError on mismatch.
    When DATABASE_URL is unset (local unit tests), logs a warning and skips DB checks.
    """
    summary = get_embedding_config_summary()
    expected_dim = settings.embedding_vector_dim
    column = summary["active_column"]

    logger.info(
        "Embedding config: provider=%s dim=%s column=%s strategy=%s require_dim_match=%s",
        summary["provider"],
        expected_dim,
        column,
        summary["retrieval_strategy"],
        summary["retrieval_require_dim_match"],
    )

    database_url = (settings.database_url or "").strip()
    if not database_url:
        summary["validation_ok"] = True
        summary["validation_message"] = "Skipped DB validation (DATABASE_URL not set)."
        logger.warning(summary["validation_message"])
        return summary

    try:
        import psycopg2  # noqa: PLC0415
    except ImportError as exc:
        msg = "psycopg2 not installed; cannot validate embedding schema at startup."
        summary["validation_ok"] = False
        summary["validation_message"] = msg
        if strict:
            raise RuntimeError(msg) from exc
        logger.warning(msg)
        return summary

    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT format_type(a.atttypid, a.atttypmod)
                FROM pg_attribute a
                JOIN pg_class c ON a.attrelid = c.oid
                JOIN pg_namespace n ON c.relnamespace = n.oid
                WHERE n.nspname = 'public'
                  AND c.relname = 'resume_chunks'
                  AND a.attname = %s
                  AND NOT a.attisdropped
                """,
                (column,),
            )
            row = cur.fetchone()
            if not row:
                raise RuntimeError(
                    f"Column resume_chunks.{column} does not exist in the database."
                )
            col_type = row[0]
            match = _VECTOR_DIM_RE.search(col_type or "")
            if not match:
                raise RuntimeError(
                    f"resume_chunks.{column} is not a pgvector column (type={col_type!r})."
                )
            db_dim = int(match.group(1))
            summary["db_column_dim"] = db_dim

            if db_dim != expected_dim:
                raise RuntimeError(
                    f"Embedding dimension mismatch: EMBEDDING_VECTOR_DIM={expected_dim} "
                    f"but resume_chunks.{column} is {col_type}."
                )

            if column == "embedding":
                cur.execute(
                    """
                    SELECT pg_get_function_arguments(p.oid)
                    FROM pg_proc p
                    JOIN pg_namespace n ON p.pronamespace = n.oid
                    WHERE n.nspname = 'public'
                      AND p.proname = 'match_resume_chunks'
                    LIMIT 1
                    """
                )
                rpc_row = cur.fetchone()
                if not rpc_row:
                    summary["rpc_available"] = False
                    logger.warning(
                        "RPC match_resume_chunks not found; retrieval will use numpy fallback."
                    )
                else:
                    summary["rpc_available"] = True
                    rpc_args = rpc_row[0] or ""
                    rpc_match = _VECTOR_DIM_RE.search(rpc_args)
                    if rpc_match:
                        rpc_dim = int(rpc_match.group(1))
                        if rpc_dim != expected_dim:
                            raise RuntimeError(
                                f"RPC match_resume_chunks expects vector({rpc_dim}) "
                                f"but EMBEDDING_VECTOR_DIM={expected_dim}."
                            )
    finally:
        conn.close()

    summary["validation_ok"] = True
    summary["validation_message"] = "Embedding configuration validated."
    logger.info(
        "Embedding startup validation passed: db_column=%s dim=%s rpc_available=%s",
        column,
        summary["db_column_dim"],
        summary["rpc_available"],
    )
    return summary
