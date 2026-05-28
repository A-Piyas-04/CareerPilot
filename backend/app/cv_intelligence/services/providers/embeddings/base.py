"""Embedding provider interfaces."""
from __future__ import annotations

from typing import Protocol


class EmbeddingProvider(Protocol):
    """Provider contract for generating vector embeddings."""

    @property
    def vector_dim(self) -> int:
        """Return expected embedding vector dimension."""

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of input texts."""

