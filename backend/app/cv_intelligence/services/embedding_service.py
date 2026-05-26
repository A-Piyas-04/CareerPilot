"""Embedding generation with two backends selectable via EMBEDDING_BACKEND env var.

EMBEDDING_BACKEND=hashing  (default)
    sklearn HashingVectorizer — deterministic, zero model download, fast cold start.
    Bag-of-words style: good for exact keyword overlap, weak for semantic queries.

EMBEDDING_BACKEND=transformers
    sentence-transformers all-MiniLM-L6-v2 — true semantic 384-dim embeddings.
    Requires `pip install sentence-transformers` and ~90 MB model download on first run.
    Set HF_TOKEN if the model is gated (not required for all-MiniLM-L6-v2).
"""
from __future__ import annotations

import os
from typing import Any

EMBEDDING_DIM: int = 384
_BACKEND: str = os.getenv("EMBEDDING_BACKEND", "hashing").lower()

# ─── Hashing backend ────────────────────────────────────────────────────────

_hashing_vectorizer: Any = None


def _get_hashing_vectorizer() -> Any:
    global _hashing_vectorizer
    if _hashing_vectorizer is None:
        from sklearn.feature_extraction.text import HashingVectorizer  # noqa: PLC0415

        _hashing_vectorizer = HashingVectorizer(
            n_features=EMBEDDING_DIM,
            alternate_sign=False,
            norm="l2",
        )
    return _hashing_vectorizer


def _embed_hashing(texts: list[str]) -> list[list[float]]:
    matrix = _get_hashing_vectorizer().transform(texts)
    return [row.tolist() for row in matrix.toarray()]


# ─── Transformers backend ────────────────────────────────────────────────────

_st_model: Any = None
_ST_MODEL_NAME = "all-MiniLM-L6-v2"


def _get_st_model() -> Any:
    global _st_model
    if _st_model is None:
        try:
            from sentence_transformers import SentenceTransformer  # noqa: PLC0415
        except ImportError as exc:
            raise RuntimeError(
                "sentence-transformers is not installed. "
                "Run: pip install sentence-transformers  "
                "or set EMBEDDING_BACKEND=hashing to use the sklearn fallback."
            ) from exc
        _st_model = SentenceTransformer(_ST_MODEL_NAME)
    return _st_model


def _embed_transformers(texts: list[str]) -> list[list[float]]:
    model = _get_st_model()
    embeddings = model.encode(texts, normalize_embeddings=True)
    return [e.tolist() for e in embeddings]


# ─── Public API ──────────────────────────────────────────────────────────────

def embed_text(text: str) -> list[float]:
    """Generate a 384-dimensional embedding for a single text string."""
    return embed_batch([text])[0]


def embed_batch(texts: list[str]) -> list[list[float]]:
    """
    Generate 384-dimensional embeddings for a list of texts.
    Backend is selected by the EMBEDDING_BACKEND environment variable.
    Returns embeddings in the same order as the input list.
    """
    if not texts:
        return []
    if _BACKEND == "transformers":
        return _embed_transformers(texts)
    return _embed_hashing(texts)
