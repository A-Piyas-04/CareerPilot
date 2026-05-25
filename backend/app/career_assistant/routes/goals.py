"""Goals and goal-linked task routes."""
from fastapi import APIRouter, Depends, Response, status

from app.career_assistant.models.goal import Goal, GoalCreate, GoalDetail, GoalUpdate
from app.career_assistant.models.task import Task, TaskCreate, TaskUpdate
from app.career_assistant.services.goals import (
    create_goal,
    create_goal_task,
    delete_goal,
    delete_task,
    get_goal_detail,
    list_goal_tasks,
    list_goals,
    update_goal,
    update_task,
)
from app.core.auth import get_current_user
from app.core.enums import GoalStatus


router = APIRouter(tags=["goals"])


@router.get("/goals", response_model=list[GoalDetail])
def list_user_goals(
    status_filter: GoalStatus | None = None,
    user_id: str = Depends(get_current_user),
) -> list[GoalDetail]:
    return list_goals(
        user_id=user_id,
        status_filter=status_filter.value if status_filter else None,
    )


@router.post("/goals", response_model=Goal, status_code=status.HTTP_201_CREATED)
def create_user_goal(
    payload: GoalCreate,
    user_id: str = Depends(get_current_user),
) -> Goal:
    return create_goal(user_id=user_id, payload=payload)


@router.get("/goals/{goal_id}", response_model=GoalDetail)
def read_goal_detail(
    goal_id: str,
    user_id: str = Depends(get_current_user),
) -> GoalDetail:
    return get_goal_detail(user_id=user_id, goal_id=goal_id)


@router.patch("/goals/{goal_id}", response_model=Goal)
def update_user_goal(
    goal_id: str,
    payload: GoalUpdate,
    user_id: str = Depends(get_current_user),
) -> Goal:
    return update_goal(user_id=user_id, goal_id=goal_id, payload=payload)


@router.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_user_goal(
    goal_id: str,
    user_id: str = Depends(get_current_user),
) -> Response:
    delete_goal(user_id=user_id, goal_id=goal_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/goals/{goal_id}/tasks", response_model=list[Task])
def list_user_goal_tasks(
    goal_id: str,
    user_id: str = Depends(get_current_user),
) -> list[Task]:
    return list_goal_tasks(user_id=user_id, goal_id=goal_id)


@router.post(
    "/goals/{goal_id}/tasks",
    response_model=Task,
    status_code=status.HTTP_201_CREATED,
)
def create_user_goal_task(
    goal_id: str,
    payload: TaskCreate,
    user_id: str = Depends(get_current_user),
) -> Task:
    return create_goal_task(user_id=user_id, goal_id=goal_id, payload=payload)


@router.patch("/tasks/{task_id}", response_model=Task)
def update_user_task(
    task_id: str,
    payload: TaskUpdate,
    user_id: str = Depends(get_current_user),
) -> Task:
    return update_task(user_id=user_id, task_id=task_id, payload=payload)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_task(
    task_id: str,
    user_id: str = Depends(get_current_user),
) -> Response:
    delete_task(user_id=user_id, task_id=task_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
