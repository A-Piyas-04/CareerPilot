"""Embedding generation using sentence-transformers all-MiniLM-L6-v2 (384 dimensions)."""
from __future__ import annotations

import os
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer as _SentenceTransformerType

EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIM: int = 384
_BATCH_SIZE: int = 32

# Local fallback path: ~/.cache/huggingface/hub/sentence-transformers_all-MiniLM-L6-v2
_LOCAL_MODEL_DIR: Path = (
    Path.home() / ".cache" / "huggingface" / "hub" / "sentence-transformers_all-MiniLM-L6-v2"
)

# Module-level singleton — loaded once on first use
_model: "_SentenceTransformerType | None" = None


def _get_model() -> "_SentenceTransformerType":
    """Lazy-load and cache the SentenceTransformer model.

    Loads from the local direct-download cache when available, otherwise falls
    back to the HuggingFace Hub ID (requires network / HF_TOKEN env var).
    """
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer  # noqa: PLC0415
        except ImportError as exc:
            raise RuntimeError(
                "sentence-transformers is not installed. Run: pip install sentence-transformers"
            ) from exc

        # Prefer the pre-downloaded local directory so HF network calls are skipped
        model_id = str(_LOCAL_MODEL_DIR) if _LOCAL_MODEL_DIR.exists() else EMBEDDING_MODEL
        _model = SentenceTransformer(model_id)
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
