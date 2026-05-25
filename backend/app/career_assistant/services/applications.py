"""Service functions for the Kanban application tracker."""
from typing import Any

from fastapi import HTTPException, status

from app.career_assistant.models.application import (
    Application,
    ApplicationCreate,
    ApplicationDetail,
    ApplicationStatusUpdate,
    ApplicationUpdate,
)
from app.career_assistant.models.application_history import ApplicationHistory
from app.core.database import get_supabase_client


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


def _not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Application not found",
    )


def list_applications(user_id: str, status_filter: str | None = None) -> list[Application]:
    query = (
        get_supabase_client()
        .table("applications")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
    )

    if status_filter:
        query = query.eq("status", status_filter)

    return [Application(**item) for item in _rows(query.execute())]


def create_application(user_id: str, payload: ApplicationCreate) -> Application:
    data = payload.model_dump(mode="json", exclude_none=True)
    data["user_id"] = user_id
    data["status"] = data.get("status", "saved")

    response = (
        get_supabase_client()
        .table("applications")
        .insert(data)
        .execute()
    )
    created = _row(response)
    if not created:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application could not be created",
        )

    return Application(**created)


def get_application_detail(user_id: str, application_id: str) -> ApplicationDetail:
    application = _get_owned_application(user_id, application_id)
    history_response = (
        get_supabase_client()
        .table("application_history")
        .select("*")
        .eq("application_id", application_id)
        .order("changed_at", desc=False)
        .execute()
    )
    history = [ApplicationHistory(**item) for item in _rows(history_response)]
    return ApplicationDetail(**application.model_dump(), history=history)


def update_application(
    user_id: str,
    application_id: str,
    payload: ApplicationUpdate,
) -> Application:
    _get_owned_application(user_id, application_id)
    data = payload.model_dump(mode="json", exclude_unset=True)

    if "manual_job_title" in data and data["manual_job_title"] is not None:
        data["manual_job_title"] = data["manual_job_title"].strip()
        if not data["manual_job_title"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Job title cannot be blank",
            )

    for key in ("manual_company", "manual_location"):
        if key in data and data[key] is not None:
            data[key] = data[key].strip() or None

    if not data:
        return _get_owned_application(user_id, application_id)

    response = (
        get_supabase_client()
        .table("applications")
        .update(data)
        .eq("id", application_id)
        .eq("user_id", user_id)
        .execute()
    )
    updated = _row(response)
    if not updated:
        raise _not_found()

    return Application(**updated)


def change_application_status(
    user_id: str,
    application_id: str,
    payload: ApplicationStatusUpdate,
) -> Application:
    try:
        response = (
            get_supabase_client()
            .rpc(
                "change_application_status",
                {
                    "p_application_id": application_id,
                    "p_user_id": user_id,
                    "p_new_status": payload.status.value,
                    "p_note": payload.note,
                },
            )
            .execute()
        )
    except Exception as exc:
        if "Application not found" in str(exc):
            raise _not_found() from exc
        raise

    changed = _row(response)
    if not changed:
        return _get_owned_application(user_id, application_id)

    return Application(**changed)


def delete_application(user_id: str, application_id: str) -> None:
    _get_owned_application(user_id, application_id)
    (
        get_supabase_client()
        .table("applications")
        .delete()
        .eq("id", application_id)
        .eq("user_id", user_id)
        .execute()
    )


def _get_owned_application(user_id: str, application_id: str) -> Application:
    response = (
        get_supabase_client()
        .table("applications")
        .select("*")
        .eq("id", application_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    application = _row(response)
    if not application:
        raise _not_found()

    return Application(**application)
