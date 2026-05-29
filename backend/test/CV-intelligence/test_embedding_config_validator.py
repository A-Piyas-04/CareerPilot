"""Tests for embedding startup configuration validation."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.cv_intelligence.services import embedding_config_validator


def test_get_embedding_config_summary_defaults() -> None:
    summary = embedding_config_validator.get_embedding_config_summary()
    assert summary["vector_dim"] == 384
    assert summary["active_column"] == "embedding"
    assert summary["retrieval_strategy"] == "rpc_then_numpy_fallback"


def test_validate_skips_without_database_url(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "app.cv_intelligence.services.embedding_config_validator.settings.database_url",
        "",
    )
    summary = embedding_config_validator.validate_embedding_config_at_startup(strict=False)
    assert summary["validation_ok"] is True
    assert "Skipped" in (summary["validation_message"] or "")


def test_validate_db_dim_mismatch_raises(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "app.cv_intelligence.services.embedding_config_validator.settings.database_url",
        "postgresql://localhost/test",
    )
    monkeypatch.setattr(
        "app.cv_intelligence.services.embedding_config_validator.settings.embedding_vector_dim",
        384,
    )

    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value.__enter__ = MagicMock(return_value=mock_cursor)
    mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    mock_cursor.fetchone.side_effect = [("vector(768)",), ("query_embedding vector(384)",)]

    with (
        patch("psycopg2.connect", return_value=mock_conn),
        pytest.raises(RuntimeError, match="dimension mismatch"),
    ):
        embedding_config_validator.validate_embedding_config_at_startup(strict=True)
