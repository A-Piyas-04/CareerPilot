"""Career Assistant test fixtures and Supabase fakes."""
from __future__ import annotations

import sys
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import pytest


BACKEND_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

USER_ID = "00000000-0000-0000-0000-000000000001"
GOAL_ID = "00000000-0000-0000-0000-000000000101"
TASK_ID = "00000000-0000-0000-0000-000000000102"
APPLICATION_ID = "00000000-0000-0000-0000-000000000201"


def now() -> str:
    return "2026-05-29T10:00:00+00:00"


def goal_row(**overrides: Any) -> dict[str, Any]:
    row = {
        "id": GOAL_ID,
        "user_id": USER_ID,
        "title": "Become ML Engineer",
        "description": "Career transition",
        "status": "active",
        "target_date": "2026-06-30",
        "created_at": now(),
        "updated_at": now(),
    }
    row.update(overrides)
    return row


def task_row(**overrides: Any) -> dict[str, Any]:
    row = {
        "id": TASK_ID,
        "user_id": USER_ID,
        "goal_id": GOAL_ID,
        "roadmap_item_id": None,
        "application_id": None,
        "title": "Learn PyTorch",
        "description": "Complete basics",
        "status": "todo",
        "priority": 2,
        "due_date": "2026-06-01",
        "completed_at": None,
        "created_at": now(),
        "updated_at": now(),
    }
    row.update(overrides)
    return row


def application_row(**overrides: Any) -> dict[str, Any]:
    row = {
        "id": APPLICATION_ID,
        "user_id": USER_ID,
        "job_id": None,
        "job_match_id": None,
        "manual_job_title": "Backend Intern",
        "manual_company": "Acme",
        "manual_location": "Remote",
        "notes": "Promising",
        "status": "saved",
        "applied_at": None,
        "deadline": "2026-06-10",
        "created_at": now(),
        "updated_at": now(),
    }
    row.update(overrides)
    return row


@pytest.fixture
def supabase() -> "SupabaseStub":
    return SupabaseStub()


def response(data: Any) -> SimpleNamespace:
    return SimpleNamespace(data=data)


class SupabaseStub:
    def __init__(self) -> None:
        self.inserts: list[tuple[str, Any]] = []
        self.updates: list[tuple[str, Any, list[tuple[str, Any]]]] = []
        self.deletes: list[tuple[str, list[tuple[str, Any]]]] = []
        self.rpcs: list[tuple[str, dict[str, Any]]] = []
        self.select_responses: dict[str, list[Any]] = {}
        self.rpc_responses: dict[str, list[Any]] = {}

    def table(self, name: str) -> "TableStub":
        return TableStub(name, self)

    def rpc(self, name: str, params: dict[str, Any]) -> "RpcStub":
        self.rpcs.append((name, params))
        return RpcStub(name, self)


class TableStub:
    def __init__(self, name: str, parent: SupabaseStub) -> None:
        self.name = name
        self.parent = parent
        self.filters: list[tuple[str, Any]] = []
        self.in_filters: list[tuple[str, list[Any]]] = []
        self.payload: Any = None
        self.mode = "select"

    def select(self, *_args: Any, **_kwargs: Any) -> "TableStub":
        self.mode = "select"
        return self

    def insert(self, payload: Any) -> "TableStub":
        self.mode = "insert"
        self.payload = payload
        return self

    def update(self, payload: Any) -> "TableStub":
        self.mode = "update"
        self.payload = payload
        return self

    def delete(self) -> "TableStub":
        self.mode = "delete"
        return self

    def eq(self, key: str, value: Any) -> "TableStub":
        self.filters.append((key, value))
        return self

    def in_(self, key: str, values: list[Any]) -> "TableStub":
        self.in_filters.append((key, values))
        return self

    def order(self, *_args: Any, **_kwargs: Any) -> "TableStub":
        return self

    def limit(self, *_args: Any, **_kwargs: Any) -> "TableStub":
        return self

    def execute(self) -> SimpleNamespace:
        if self.mode == "insert":
            self.parent.inserts.append((self.name, self.payload))
            payloads = self.payload if isinstance(self.payload, list) else [self.payload]
            return response([self._insert_row(payload) for payload in payloads])
        if self.mode == "update":
            self.parent.updates.append((self.name, self.payload, self.filters))
            rows = self.parent.select_responses.get(self.name, [])
            return response(rows.pop(0) if rows else [{**self.payload}])
        if self.mode == "delete":
            self.parent.deletes.append((self.name, self.filters))
            return response([])

        rows = self.parent.select_responses.get(self.name, [])
        return response(rows.pop(0) if rows else [])

    def _insert_row(self, payload: dict[str, Any]) -> dict[str, Any]:
        if self.name == "applications":
            return application_row(**payload)
        if self.name == "goals":
            return goal_row(**payload)
        if self.name == "tasks":
            return task_row(**payload)
        return {**payload}


class RpcStub:
    def __init__(self, name: str, parent: SupabaseStub) -> None:
        self.name = name
        self.parent = parent

    def execute(self) -> SimpleNamespace:
        rows = self.parent.rpc_responses.get(self.name, [])
        return response(rows.pop(0) if rows else [])
