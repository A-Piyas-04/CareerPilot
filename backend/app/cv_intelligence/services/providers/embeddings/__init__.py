"""Embedding provider factory."""
from __future__ import annotations

from app.core.config import settings
from app.cv_intelligence.services.providers.embeddings.base import EmbeddingProvider
from app.cv_intelligence.services.providers.embeddings.gemini_embeddings import (
    GeminiEmbeddingProvider,
)


def get_embedding_provider() -> EmbeddingProvider:
    """Return configured embedding provider implementation."""
    backend = settings.embedding_backend.lower().strip()
    if backend == "gemini":
        return GeminiEmbeddingProvider()
    raise RuntimeError(
        f"Unsupported embedding backend '{backend}'. "
        "Set EMBEDDING_BACKEND=gemini."
    )

