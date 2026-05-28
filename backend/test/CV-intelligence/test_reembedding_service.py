"""Tests for re-embedding migration helpers."""
from __future__ import annotations

from app.cv_intelligence.services import reembedding_service


class _UpdateQuery:
    def __init__(self, sink: list[dict], payload: dict):
        self._sink = sink
        self._payload = payload
        self._id = None

    def eq(self, _key, val):
        self._id = val
        return self

    def execute(self):
        self._sink.append({"id": self._id, "payload": self._payload})
        return None


class _Table:
    def __init__(self, sink: list[dict]):
        self._sink = sink

    def update(self, payload: dict):
        return _UpdateQuery(self._sink, payload)


class _SupabaseStub:
    def __init__(self, sink: list[dict]):
        self._sink = sink

    def table(self, _name):
        return _Table(self._sink)


def test_reembed_batch_writes_only_missing_target_embeddings(monkeypatch) -> None:
    updates: list[dict] = []
    monkeypatch.setattr(
        reembedding_service,
        "get_supabase_client",
        lambda: _SupabaseStub(updates),
    )
    monkeypatch.setattr(
        reembedding_service,
        "embed_document_batch",
        lambda texts: [[0.1, 0.2] for _ in texts],
    )
    rows = [
        {"id": "a", "chunk_text": "python", "embedding_new": None},
        {"id": "b", "chunk_text": "docker", "embedding_new": [0.7, 0.8]},
    ]
    updated = reembedding_service.reembed_batch(rows, target_column="embedding_new")
    assert updated == 1
    assert updates == [{"id": "a", "payload": {"embedding_new": [0.1, 0.2]}}]


def test_reembed_batch_idempotent_when_all_present(monkeypatch) -> None:
    updates: list[dict] = []
    monkeypatch.setattr(
        reembedding_service,
        "get_supabase_client",
        lambda: _SupabaseStub(updates),
    )
    monkeypatch.setattr(
        reembedding_service,
        "embed_document_batch",
        lambda texts: [[0.1, 0.2] for _ in texts],
    )
    rows = [{"id": "a", "chunk_text": "python", "embedding_new": [0.1, 0.2]}]
    updated = reembedding_service.reembed_batch(rows, target_column="embedding_new")
    assert updated == 0
    assert updates == []

