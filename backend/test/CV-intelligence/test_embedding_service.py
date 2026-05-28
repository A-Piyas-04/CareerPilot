"""Tests for provider-based embedding_service behavior."""
from __future__ import annotations

import pytest

from app.cv_intelligence.services import embedding_service


class _StubProvider:
    vector_dim = 4

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [[float(i + 1)] * self.vector_dim for i, _ in enumerate(texts)]


class _BadDimProvider:
    vector_dim = 4

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [[1.0, 2.0, 3.0] for _ in texts]


def test_embed_batch_empty() -> None:
    assert embedding_service.embed_batch([]) == []


def test_embed_batch_uses_provider(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        embedding_service,
        "get_embedding_provider",
        lambda: _StubProvider(),
    )
    result = embedding_service.embed_batch(["a", "b"])
    assert result == [[1.0, 1.0, 1.0, 1.0], [2.0, 2.0, 2.0, 2.0]]


def test_embed_text_first_item(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        embedding_service,
        "get_embedding_provider",
        lambda: _StubProvider(),
    )
    assert embedding_service.embed_text("hello") == [1.0, 1.0, 1.0, 1.0]


def test_dimension_mismatch_raises(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        embedding_service,
        "get_embedding_provider",
        lambda: _BadDimProvider(),
    )
    with pytest.raises(RuntimeError, match="Embedding dimension mismatch"):
        embedding_service.embed_batch(["x"])
