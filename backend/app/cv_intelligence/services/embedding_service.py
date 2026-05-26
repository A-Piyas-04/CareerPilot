"""Embedding generation using scikit-learn HashingVectorizer (384 dimensions)."""
from __future__ import annotations

from sklearn.feature_extraction.text import HashingVectorizer

EMBEDDING_DIM: int = 384

_vectorizer: HashingVectorizer | None = None


def _get_vectorizer() -> HashingVectorizer:
    """Lazy-init singleton HashingVectorizer (deterministic, no model download)."""
    global _vectorizer
    if _vectorizer is None:
        _vectorizer = HashingVectorizer(
            n_features=EMBEDDING_DIM,
            alternate_sign=False,
            norm="l2",
        )
    return _vectorizer


def embed_text(text: str) -> list[float]:
    """Generate a 384-dimensional embedding for a single text string."""
    matrix = _get_vectorizer().transform([text])
    return matrix.toarray()[0].tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    """
    Generate 384-dimensional embeddings for a list of texts.

    Returns embeddings in the same order as the input list.
    """
    if not texts:
        return []
    matrix = _get_vectorizer().transform(texts)
    return [row.tolist() for row in matrix.toarray()]
