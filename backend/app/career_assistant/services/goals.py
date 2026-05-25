"""Service functions for goals and goal-linked tasks."""
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status

from app.career_assistant.models.goal import Goal, GoalCreate, GoalDetail, GoalUpdate
from app.career_assistant.models.task import Task, TaskCreate, TaskUpdate
from app.core.database import get_supabase_client
from app.core.enums import GoalStatus, TaskStatus


def _rows(response: Any) -> list[dict[str, Any]]:
    data = getattr(response, "data", None)
    if data is None and isinstance(response, dict):
        data = response.get("data")
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        return [data]
    return []


def _row(response: Any) -> dict[str, Any] | None:
    rows = _rows(response)
    return rows[0] if rows else None


def _not_found(resource: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} not found",
    )


def list_goals(user_id: str, status_filter: str | None = None) -> list[GoalDetail]:
    query = (
        get_supabase_client()
        .table("goals")
        .select("*")
        .eq("user_id", user_id)
        .order("target_date", desc=False)
        .order("updated_at", desc=True)
    )

    if status_filter:
        query = query.eq("status", status_filter)

    goal_rows = _rows(query.execute())
    if not goal_rows:
        return []

    goal_ids = [goal["id"] for goal in goal_rows]
    task_rows = _rows(
        get_supabase_client()
        .table("tasks")
        .select("*")
        .eq("user_id", user_id)
        .in_("goal_id", goal_ids)
        .order("status", desc=False)
        .order("due_date", desc=False)
        .order("priority", desc=True)
        .execute()
    )

    tasks_by_goal: dict[str, list[Task]] = {goal_id: [] for goal_id in goal_ids}
    for task in task_rows:
        goal_id = task.get("goal_id")
        if goal_id in tasks_by_goal:
            tasks_by_goal[goal_id].append(Task(**task))

    return [
        GoalDetail(**goal, tasks=tasks_by_goal.get(goal["id"], []))
        for goal in goal_rows
    ]


def create_goal(user_id: str, payload: GoalCreate) -> Goal:
    data = payload.model_dump(mode="json", exclude_none=True)
    data["user_id"] = user_id

    response = get_supabase_client().table("goals").insert(data).execute()
    created = _row(response)
    if not created:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Goal could not be created",
        )

    return Goal(**created)


def get_goal_detail(user_id: str, goal_id: str) -> GoalDetail:
    goal = _get_owned_goal(user_id, goal_id)
    tasks = list_goal_tasks(user_id, goal_id)
    return GoalDetail(**goal.model_dump(), tasks=tasks)


def update_goal(user_id: str, goal_id: str, payload: GoalUpdate) -> Goal:
    _get_owned_goal(user_id, goal_id)
    data = payload.model_dump(mode="json", exclude_unset=True)

    if "title" in data and data["title"] is not None:
        data["title"] = data["title"].strip()
        if not data["title"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Goal title cannot be blank",
            )

    if "description" in data and data["description"] is not None:
        data["description"] = data["description"].strip() or None

    if not data:
        return _get_owned_goal(user_id, goal_id)

    response = (
        get_supabase_client()
        .table("goals")
        .update(data)
        .eq("id", goal_id)
        .eq("user_id", user_id)
        .execute()
    )
    updated = _row(response)
    if not updated:
        raise _not_found("Goal")

    return Goal(**updated)


def delete_goal(user_id: str, goal_id: str) -> None:
    _get_owned_goal(user_id, goal_id)
    (
        get_supabase_client()
        .table("goals")
        .update({"status": GoalStatus.CANCELLED.value})
        .eq("id", goal_id)
        .eq("user_id", user_id)
        .execute()
    )


def list_goal_tasks(user_id: str, goal_id: str) -> list[Task]:
    _get_owned_goal(user_id, goal_id)
    response = (
        get_supabase_client()
        .table("tasks")
        .select("*")
        .eq("user_id", user_id)
        .eq("goal_id", goal_id)
        .order("status", desc=False)
        .order("due_date", desc=False)
        .order("priority", desc=True)
        .execute()
    )
    return [Task(**item) for item in _rows(response)]


def create_goal_task(user_id: str, goal_id: str, payload: TaskCreate) -> Task:
    _get_owned_goal(user_id, goal_id)
    data = payload.model_dump(mode="json", exclude_none=True)
    data["user_id"] = user_id
    data["goal_id"] = goal_id
    data.pop("roadmap_item_id", None)
    data.pop("application_id", None)

    response = get_supabase_client().table("tasks").insert(data).execute()
    created = _row(response)
    if not created:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task could not be created",
        )

    return Task(**created)


def update_task(user_id: str, task_id: str, payload: TaskUpdate) -> Task:
    _get_owned_task(user_id, task_id)
    data = payload.model_dump(mode="json", exclude_unset=True)

    for relation_key in ("goal_id", "roadmap_item_id", "application_id"):
        data.pop(relation_key, None)

    if "title" in data and data["title"] is not None:
        data["title"] = data["title"].strip()
        if not data["title"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Task title cannot be blank",
            )

    if "description" in data and data["description"] is not None:
        data["description"] = data["description"].strip() or None

    if data.get("status") == TaskStatus.DONE.value:
        data["completed_at"] = datetime.now(timezone.utc).isoformat()
    elif "status" in data:
        data["completed_at"] = None

    if not data:
        return _get_owned_task(user_id, task_id)

    response = (
        get_supabase_client()
        .table("tasks")
        .update(data)
        .eq("id", task_id)
        .eq("user_id", user_id)
        .execute()
    )
    updated = _row(response)
    if not updated:
        raise _not_found("Task")

    return Task(**updated)


def delete_task(user_id: str, task_id: str) -> None:
    _get_owned_task(user_id, task_id)
    (
        get_supabase_client()
        .table("tasks")
        .delete()
        .eq("id", task_id)
        .eq("user_id", user_id)
        .execute()
    )


def _get_owned_goal(user_id: str, goal_id: str) -> Goal:
    response = (
        get_supabase_client()
        .table("goals")
        .select("*")
        .eq("id", goal_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    goal = _row(response)
    if not goal:
        raise _not_found("Goal")

    return Goal(**goal)


def _get_owned_task(user_id: str, task_id: str) -> Task:
    response = (
        get_supabase_client()
        .table("tasks")
        .select("*")
        .eq("id", task_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    task = _row(response)
    if not task:
        raise _not_found("Task")

    return Task(**task)
