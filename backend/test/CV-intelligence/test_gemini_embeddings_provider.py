"""Tests for Gemini embedding task-type routing."""
from __future__ import annotations

from app.cv_intelligence.services.providers.embeddings.gemini_embeddings import (
    GeminiEmbeddingProvider,
)


class _FakeClient:
    def __init__(self) -> None:
        self.calls: list[dict] = []

    def embed_content(self, **kwargs):
        self.calls.append(kwargs)
        return {"embedding": [0.1, 0.2, 0.3, 0.4]}


class _ModelFallbackClient:
    def __init__(self) -> None:
        self.calls: list[str] = []

    def embed_content(self, **kwargs):
        model = kwargs["model"]
        self.calls.append(model)
        if model in {"models/text-embedding-004", "models/embedding-001"}:
            raise RuntimeError("404 model not found")
        return {"embedding": [0.1, 0.2, 0.3, 0.4]}


def test_documents_use_retrieval_document() -> None:
    provider = GeminiEmbeddingProvider()
    provider._vector_dim = 4
    fake = _FakeClient()
    provider._get_client = lambda: fake  # type: ignore[method-assign]

    provider.embed_documents(["resume chunk"])

    assert fake.calls[0]["task_type"] == "retrieval_document"


def test_query_uses_retrieval_query() -> None:
    provider = GeminiEmbeddingProvider()
    provider._vector_dim = 4
    fake = _FakeClient()
    provider._get_client = lambda: fake  # type: ignore[method-assign]

    provider.embed_query("python backend?")

    assert fake.calls[0]["task_type"] == "retrieval_query"


def test_fallbacks_to_alternate_model_alias() -> None:
    provider = GeminiEmbeddingProvider()
    provider._vector_dim = 4
    provider._model = "models/text-embedding-004"
    fake = _ModelFallbackClient()
    provider._get_client = lambda: fake  # type: ignore[method-assign]

    provider.embed_query("which stack did I use?")

    assert fake.calls[0] == "models/text-embedding-004"
    assert "text-embedding-004" in fake.calls

