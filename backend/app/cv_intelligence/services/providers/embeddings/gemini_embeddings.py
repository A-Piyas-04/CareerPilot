"""Gemini embedding provider implementation."""
from __future__ import annotations

import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiEmbeddingProvider:
    """Generate embeddings through Google Gemini embedding API."""

    def __init__(self) -> None:
        self._api_key = settings.gemini_api_key.strip()
        self._model = settings.gemini_embedding_model.strip() or "models/text-embedding-004"
        self._vector_dim = int(settings.embedding_vector_dim)
        self._genai: Any = None

    @property
    def vector_dim(self) -> int:
        return self._vector_dim

    def _get_client(self) -> Any:
        if not self._api_key or self._api_key.startswith("your-"):
            raise RuntimeError(
                "GEMINI_API_KEY is not configured. "
                "Set GEMINI_API_KEY to enable Gemini embeddings."
            )
        if self._genai is None:
            try:
                import google.generativeai as genai  # noqa: PLC0415
            except ImportError as exc:
                raise RuntimeError(
                    "google-generativeai is not installed. "
                    "Run: pip install google-generativeai"
                ) from exc
            genai.configure(api_key=self._api_key)
            self._genai = genai
        return self._genai

    def _embed_one(self, client: Any, text: str) -> list[float]:
        payload = text.strip() or " "
        kwargs = {
            "model": self._model,
            "content": payload,
            "task_type": "retrieval_document",
        }
        try:
            # Preferred path when supported by current SDK/model.
            response = client.embed_content(
                **kwargs,
                output_dimensionality=self._vector_dim,
            )
        except TypeError:
            response = client.embed_content(**kwargs)

        vector = response.get("embedding") if isinstance(response, dict) else None
        if not isinstance(vector, list):
            raise RuntimeError("Gemini embedding response missing 'embedding' vector.")

        casted = [float(x) for x in vector]
        if len(casted) != self._vector_dim:
            raise RuntimeError(
                f"Embedding dimension mismatch: expected {self._vector_dim}, "
                f"got {len(casted)} from model {self._model}."
            )
        return casted

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        client = self._get_client()
        results: list[list[float]] = []
        for text in texts:
            results.append(self._embed_one(client, text))
        return results

