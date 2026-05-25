"""Embedding generation using sentence-transformers all-MiniLM-L6-v2 (384 dimensions)."""
from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer as _SentenceTransformerType

EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIM: int = 384
_BATCH_SIZE: int = 32

# Module-level singleton — loaded once on first use
_model: "_SentenceTransformerType | None" = None


def _get_model() -> "_SentenceTransformerType":
    """Lazy-load and cache the SentenceTransformer model."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer  # noqa: PLC0415
        except ImportError as exc:
            raise RuntimeError(
                "sentence-transformers is not installed. Run: pip install sentence-transformers"
            ) from exc
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def embed_text(text: str) -> list[float]:
    """Generate a 384-dimensional embedding for a single text string."""
    model = _get_model()
    vector = model.encode(text, convert_to_numpy=True)
    return vector.tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    """
    Generate 384-dimensional embeddings for a list of texts.

    Uses batched encoding for efficiency. Returns embeddings in the same order
    as the input list.
    """
    if not texts:
        return []
    model = _get_model()
    vectors = model.encode(texts, batch_size=_BATCH_SIZE, convert_to_numpy=True)
    return [v.tolist() for v in vectors]
