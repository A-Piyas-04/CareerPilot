"""Kanban application tracker routes."""
from fastapi import APIRouter, Depends, Response, status

from app.career_assistant.models.application import (
    Application,
    ApplicationCreate,
    ApplicationDetail,
    ApplicationStatusUpdate,
    ApplicationUpdate,
)
from app.career_assistant.services.applications import (
    change_application_status,
    create_application,
    delete_application,
    get_application_detail,
    list_applications,
    update_application,
)
from app.core.auth import get_current_user
from app.core.enums import ApplicationStatus


router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("", response_model=list[Application])
def list_user_applications(
    status_filter: ApplicationStatus | None = None,
    user_id: str = Depends(get_current_user),
) -> list[Application]:
    return list_applications(
        user_id=user_id,
        status_filter=status_filter.value if status_filter else None,
    )


@router.post("", response_model=Application, status_code=status.HTTP_201_CREATED)
def create_manual_application(
    payload: ApplicationCreate,
    user_id: str = Depends(get_current_user),
) -> Application:
    return create_application(user_id=user_id, payload=payload)


@router.get("/{application_id}", response_model=ApplicationDetail)
def read_application_detail(
    application_id: str,
    user_id: str = Depends(get_current_user),
) -> ApplicationDetail:
    return get_application_detail(user_id=user_id, application_id=application_id)


@router.patch("/{application_id}", response_model=Application)
def update_manual_application(
    application_id: str,
    payload: ApplicationUpdate,
    user_id: str = Depends(get_current_user),
) -> Application:
    return update_application(
        user_id=user_id,
        application_id=application_id,
        payload=payload,
    )


@router.patch("/{application_id}/status", response_model=Application)
def update_status(
    application_id: str,
    payload: ApplicationStatusUpdate,
    user_id: str = Depends(get_current_user),
) -> Application:
    return change_application_status(
        user_id=user_id,
        application_id=application_id,
        payload=payload,
    )


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_application(
    application_id: str,
    user_id: str = Depends(get_current_user),
) -> Response:
    delete_application(user_id=user_id, application_id=application_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
