"""Feature 1.2 goals and goal-linked task service tests."""
from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.career_assistant.models.goal import GoalCreate, GoalUpdate
from app.career_assistant.models.task import TaskCreate, TaskUpdate
from app.career_assistant.services import goals
from app.core.enums import GoalStatus, TaskStatus

from conftest import GOAL_ID, TASK_ID, USER_ID, goal_row, task_row


@pytest.fixture(autouse=True)
def patch_supabase(monkeypatch: pytest.MonkeyPatch, supabase):
    monkeypatch.setattr(goals, "get_supabase_client", lambda: supabase)


def test_list_goals_groups_tasks_by_goal(supabase):
    second_goal = goal_row(id="00000000-0000-0000-0000-000000000103", title="Backend")
    supabase.select_responses["goals"] = [[goal_row(), second_goal]]
    supabase.select_responses["tasks"] = [[task_row(goal_id=GOAL_ID)]]

    result = goals.list_goals(USER_ID)

    assert len(result) == 2
    assert result[0].tasks[0].title == "Learn PyTorch"
    assert result[1].tasks == []


def test_create_goal_inserts_user_scoped_payload(supabase):
    payload = GoalCreate(title="  Ship portfolio  ", description="  Build projects  ")

    goals.create_goal(USER_ID, payload)

    table, inserted = supabase.inserts[0]
    assert table == "goals"
    assert inserted["user_id"] == USER_ID
    assert inserted["title"] == "Ship portfolio"
    assert inserted["description"] == "Build projects"


def test_update_goal_rejects_blank_title(supabase):
    supabase.select_responses["goals"] = [[goal_row()]]

    with pytest.raises(HTTPException) as exc:
        goals.update_goal(USER_ID, GOAL_ID, GoalUpdate(title="   "))

    assert exc.value.status_code == 422


def test_delete_goal_soft_cancels_owned_goal(supabase):
    supabase.select_responses["goals"] = [[goal_row()]]

    goals.delete_goal(USER_ID, GOAL_ID)

    assert supabase.updates[-1] == (
        "goals",
        {"status": GoalStatus.CANCELLED.value},
        [("id", GOAL_ID), ("user_id", USER_ID)],
    )


def test_create_goal_task_forces_goal_relation_and_strips_other_relations(supabase):
    supabase.select_responses["goals"] = [[goal_row()]]
    payload = TaskCreate(
        title="  Practice interviews  ",
        goal_id="other",
        roadmap_item_id="roadmap",
        application_id="application",
    )

    goals.create_goal_task(USER_ID, GOAL_ID, payload)

    table, inserted = supabase.inserts[0]
    assert table == "tasks"
    assert inserted["user_id"] == USER_ID
    assert inserted["goal_id"] == GOAL_ID
    assert "roadmap_item_id" not in inserted
    assert "application_id" not in inserted


def test_update_task_sets_completed_at_when_done_and_clears_when_reopened(supabase):
    supabase.select_responses["tasks"] = [
        [task_row()],
        [task_row(status="done", completed_at="2026-05-29T10:10:00+00:00")],
        [task_row(status="done", completed_at="2026-05-29T10:10:00+00:00")],
        [task_row(status="todo", completed_at=None)],
    ]

    done = goals.update_task(USER_ID, TASK_ID, TaskUpdate(status=TaskStatus.DONE))
    reopened = goals.update_task(USER_ID, TASK_ID, TaskUpdate(status=TaskStatus.TODO))

    assert done.status == TaskStatus.DONE
    assert supabase.updates[0][1]["completed_at"] is not None
    assert reopened.status == TaskStatus.TODO
    assert supabase.updates[1][1]["completed_at"] is None


def test_update_task_prevents_relation_changes(supabase):
    supabase.select_responses["tasks"] = [[task_row()], [task_row(title="Updated")]]

    goals.update_task(
        USER_ID,
        TASK_ID,
        TaskUpdate(title="Updated", roadmap_item_id="malicious"),
    )

    _, payload, filters = supabase.updates[0]
    assert "roadmap_item_id" not in payload
    assert filters == [("id", TASK_ID), ("user_id", USER_ID)]
