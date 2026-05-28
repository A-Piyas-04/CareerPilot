"""Embedding service facade backed by provider implementations."""
from __future__ import annotations

from app.core.config import settings
from app.cv_intelligence.services.providers.embeddings import get_embedding_provider

EMBEDDING_DIM: int = int(settings.embedding_vector_dim)

def embed_text(text: str) -> list[float]:
    """Generate an embedding vector for a single text string."""
    return embed_batch([text])[0]


def embed_batch(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of texts.
    Backend is selected by EMBEDDING_BACKEND.
    Returns embeddings in the same order as the input list.
    """
    if not texts:
        return []
    provider = get_embedding_provider()
    vectors = provider.embed_batch(texts)
    for vec in vectors:
        if len(vec) != provider.vector_dim:
            raise RuntimeError(
                f"Embedding dimension mismatch: expected {provider.vector_dim}, "
                f"got {len(vec)}."
            )
    return vectors
