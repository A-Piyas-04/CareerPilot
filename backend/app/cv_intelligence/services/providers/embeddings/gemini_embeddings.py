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
        self._model = settings.gemini_embedding_model.strip() or "models/embedding-001"
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

    def _embed_one(self, client: Any, text: str, task_type: str) -> list[float]:
        payload = text.strip() or " "
        response: Any = None
        last_exc: Exception | None = None
        for model_name in self._candidate_models():
            kwargs = {
                "model": model_name,
                "content": payload,
                "task_type": task_type,
            }
            try:
                # Preferred path when supported by current SDK/model.
                response = client.embed_content(
                    **kwargs,
                    output_dimensionality=self._vector_dim,
                )
                break
            except TypeError:
                try:
                    response = client.embed_content(**kwargs)
                    break
                except Exception as exc:
                    if self._is_model_unsupported_for_embeddings(exc):
                        logger.warning(
                            "Gemini embedding model '%s' unsupported; trying fallback.",
                            model_name,
                        )
                        last_exc = exc
                        continue
                    raise
            except Exception as exc:
                if self._is_model_unsupported_for_embeddings(exc):
                    logger.warning(
                        "Gemini embedding model '%s' unsupported; trying fallback.",
                        model_name,
                    )
                    last_exc = exc
                    continue
                raise
        else:
            if last_exc is not None:
                raise RuntimeError(
                    "No supported Gemini embedding model found. "
                    "Set GEMINI_EMBEDDING_MODEL to a model your SDK supports."
                ) from last_exc
            raise RuntimeError("Failed to generate Gemini embedding.")

        vector = response.get("embedding") if isinstance(response, dict) else None
        if not isinstance(vector, list):
            raise RuntimeError("Gemini embedding response missing 'embedding' vector.")

        casted = [float(x) for x in vector]
        if len(casted) != self._vector_dim:
            casted = self._coerce_dimension(casted)
        return casted

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        client = self._get_client()
        results: list[list[float]] = []
        for text in texts:
            results.append(self._embed_one(client, text, task_type="retrieval_document"))
        return results

    def embed_query(self, text: str) -> list[float]:
        client = self._get_client()
        return self._embed_one(client, text, task_type="retrieval_query")

    def _candidate_models(self) -> list[str]:
        """Return de-duplicated model aliases to survive SDK naming differences."""
        configured = self._model
        candidates: list[str] = [configured]
        if configured.startswith("models/"):
            candidates.append(configured.removeprefix("models/"))
        else:
            candidates.append(f"models/{configured}")
        # Common current Gemini embedding aliases.
        candidates.extend(["models/gemini-embedding-001", "gemini-embedding-001"])
        # Safe legacy fallback for older SDK/API combinations.
        candidates.extend(
            [
                "models/embedding-001",
                "embedding-001",
                "text-embedding-004",
                "models/text-embedding-004",
            ]
        )

        deduped: list[str] = []
        seen: set[str] = set()
        for name in candidates:
            clean = name.strip()
            if clean and clean not in seen:
                seen.add(clean)
                deduped.append(clean)
        discovered = self._discover_embed_models()
        for name in discovered:
            if name not in seen:
                seen.add(name)
                deduped.append(name)
        return deduped

    def _discover_embed_models(self) -> list[str]:
        """
        Query available models and keep ones that support embedContent.

        This avoids hardcoding model IDs that can vary by API version/account.
        """
        try:
            client = self._get_client()
            models = client.list_models()
        except Exception:
            return []

        discovered: list[str] = []
        for model in models:
            methods = getattr(model, "supported_generation_methods", None) or []
            normalized = {str(item).lower() for item in methods}
            if "embedcontent" not in normalized:
                continue
            name = str(getattr(model, "name", "")).strip()
            if not name:
                continue
            discovered.append(name)
            # Include paired alias form because SDKs differ in accepted prefix.
            if name.startswith("models/"):
                discovered.append(name.removeprefix("models/"))
            else:
                discovered.append(f"models/{name}")

        # Preserve order while de-duplicating.
        unique: list[str] = []
        seen: set[str] = set()
        for name in discovered:
            if name not in seen:
                seen.add(name)
                unique.append(name)
        return unique

    @staticmethod
    def _is_model_unsupported_for_embeddings(exc: Exception) -> bool:
        message = str(exc).lower()
        return (
            ("not found" in message and "model" in message)
            or "not supported for embedcontent" in message
            or "modelservice.listmodels" in message
            or ("404" in message and "embed" in message)
        )

    def _coerce_dimension(self, vector: list[float]) -> list[float]:
        """
        Coerce vectors when provider ignores output_dimensionality.

        Some SDK/model combos return native-size vectors even when a target
        dimensionality is requested. For smaller DB schemas, truncate; for
        smaller-than-expected vectors, fail fast to avoid silent corruption.
        """
        current_dim = len(vector)
        if current_dim > self._vector_dim:
            logger.warning(
                "Gemini returned %s dimensions; truncating to configured %s.",
                current_dim,
                self._vector_dim,
            )
            return vector[: self._vector_dim]
        raise RuntimeError(
            f"Embedding dimension mismatch: expected {self._vector_dim}, "
            f"got {current_dim} from model {self._model}."
        )

