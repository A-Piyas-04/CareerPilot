"""Embedding service facade backed by provider implementations."""
from __future__ import annotations

from app.core.config import settings
from app.cv_intelligence.services.providers.embeddings import get_embedding_provider

EMBEDDING_DIM: int = int(settings.embedding_vector_dim)


def _validate_vectors(vectors: list[list[float]], expected_dim: int) -> None:
    for vec in vectors:
        if len(vec) != expected_dim:
            raise RuntimeError(
                f"Embedding dimension mismatch: expected {expected_dim}, "
                f"got {len(vec)}."
            )


def embed_document_text(text: str) -> list[float]:
    """Generate a retrieval_document embedding for a single text."""
    return embed_document_batch([text])[0]


def embed_document_batch(texts: list[str]) -> list[list[float]]:
    """
    Generate retrieval_document embeddings for a list of texts.
    Backend is selected by EMBEDDING_BACKEND.
    Returns embeddings in the same order as the input list.
    """
    if not texts:
        return []
    provider = get_embedding_provider()
    vectors = provider.embed_documents(texts)
    _validate_vectors(vectors, provider.vector_dim)
    return vectors


def embed_query_text(text: str) -> list[float]:
    """Generate a retrieval_query embedding for user input text."""
    provider = get_embedding_provider()
    vector = provider.embed_query(text)
    _validate_vectors([vector], provider.vector_dim)
    return vector


def embed_text(text: str) -> list[float]:
    """Backward-compatible alias for document embeddings."""
    return embed_document_text(text)


def embed_batch(texts: list[str]) -> list[list[float]]:
    """Backward-compatible alias for document batch embeddings."""
    return embed_document_batch(texts)
