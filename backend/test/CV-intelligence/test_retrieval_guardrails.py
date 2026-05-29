"""Tests for retrieval migration guardrails."""
from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.cv_intelligence.services import retrieval_service


class _Resp:
    def __init__(self, data):
        self.data = data


class _TableQuery:
    def __init__(self, rows):
        self._rows = rows

    def select(self, _cols):
        return self

    def eq(self, _key, _val):
        return self

    def execute(self):
        return _Resp(self._rows)


class _SupabaseStub:
    def __init__(self, rows):
        self._rows = rows

    def table(self, _name):
        return _TableQuery(self._rows)


def test_dim_mismatch_raises_when_guard_enabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(retrieval_service.settings, "retrieval_require_dim_match", True)
    monkeypatch.setattr(retrieval_service.settings, "embedding_active_column", "embedding_new")
    monkeypatch.setattr(retrieval_service, "run_supabase", lambda _ctx, fn: fn())

    supabase = _SupabaseStub(
        [
            {
                "id": "1",
                "resume_id": "r1",
                "section_name": "Skills",
                "chunk_text": "python docker",
                "embedding_new": [0.1, 0.2, 0.3],  # mismatch vs query dim=4
            }
        ]
    )
    with pytest.raises(HTTPException) as exc:
        retrieval_service._python_cosine_search(
            user_id="u1",
            query_embedding=[0.1, 0.2, 0.3, 0.4],
            supabase=supabase,  # type: ignore[arg-type]
            resume_id=None,
            top_k=5,
            min_similarity=0.0,
        )
    assert exc.value.status_code == 503


def test_dim_mismatch_skips_when_guard_disabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(retrieval_service.settings, "retrieval_require_dim_match", False)
    monkeypatch.setattr(retrieval_service.settings, "embedding_active_column", "embedding_new")
    monkeypatch.setattr(retrieval_service, "run_supabase", lambda _ctx, fn: fn())

    supabase = _SupabaseStub(
        [
            {
                "id": "1",
                "resume_id": "r1",
                "section_name": "Skills",
                "chunk_text": "python docker",
                "embedding_new": [0.1, 0.2, 0.3],
            }
        ]
    )
    result = retrieval_service._python_cosine_search(
        user_id="u1",
        query_embedding=[0.1, 0.2, 0.3, 0.4],
        supabase=supabase,  # type: ignore[arg-type]
        resume_id=None,
        top_k=5,
        min_similarity=0.0,
    )
    assert result == []

