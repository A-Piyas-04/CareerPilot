"""Feature 1.1 application tracker service tests."""
from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.career_assistant.models.application import (
    ApplicationCreate,
    ApplicationStatusUpdate,
    ApplicationUpdate,
)
from app.career_assistant.services import applications
from app.core.enums import ApplicationStatus

from conftest import APPLICATION_ID, USER_ID, application_row


@pytest.fixture(autouse=True)
def patch_supabase(monkeypatch: pytest.MonkeyPatch, supabase):
    monkeypatch.setattr(applications, "get_supabase_client", lambda: supabase)


def test_list_applications_scopes_to_user_and_status(supabase):
    supabase.select_responses["applications"] = [[application_row(status="applied")]]

    result = applications.list_applications(USER_ID, status_filter="applied")

    assert len(result) == 1
    assert result[0].status == ApplicationStatus.APPLIED


def test_create_application_trims_manual_fields_and_defaults_saved(supabase):
    payload = ApplicationCreate(
        manual_job_title=" Backend Intern ",
        manual_company=" Acme ",
        manual_location=" Remote ",
    )

    applications.create_application(USER_ID, payload)

    table, inserted = supabase.inserts[0]
    assert table == "applications"
    assert inserted["user_id"] == USER_ID
    assert inserted["manual_job_title"] == "Backend Intern"
    assert inserted["manual_company"] == "Acme"
    assert inserted["status"] == "saved"


def test_update_application_rejects_blank_title(supabase):
    supabase.select_responses["applications"] = [[application_row()]]

    with pytest.raises(HTTPException) as exc:
        applications.update_application(
            USER_ID,
            APPLICATION_ID,
            ApplicationUpdate(manual_job_title="   "),
        )

    assert exc.value.status_code == 422


def test_change_status_uses_rpc_with_user_id_and_note(supabase):
    supabase.rpc_responses["change_application_status"] = [
        [application_row(status="interviewing")],
    ]

    changed = applications.change_application_status(
        USER_ID,
        APPLICATION_ID,
        ApplicationStatusUpdate(status=ApplicationStatus.INTERVIEWING, note="Phone screen"),
    )

    assert changed.status == ApplicationStatus.INTERVIEWING
    name, params = supabase.rpcs[0]
    assert name == "change_application_status"
    assert params["p_user_id"] == USER_ID
    assert params["p_application_id"] == APPLICATION_ID
    assert params["p_new_status"] == "interviewing"
    assert params["p_note"] == "Phone screen"


def test_get_application_detail_returns_history(supabase):
    supabase.select_responses["applications"] = [[application_row()]]
    supabase.select_responses["application_history"] = [
        [
            {
                "id": "00000000-0000-0000-0000-000000000301",
                "application_id": APPLICATION_ID,
                "old_status": "saved",
                "new_status": "applied",
                "note": "Submitted",
                "changed_at": "2026-05-29T10:05:00+00:00",
            }
        ]
    ]

    detail = applications.get_application_detail(USER_ID, APPLICATION_ID)

    assert detail.id == APPLICATION_ID
    assert len(detail.history) == 1
    assert detail.history[0].new_status == ApplicationStatus.APPLIED


def test_delete_application_verifies_ownership_before_delete(supabase):
    supabase.select_responses["applications"] = [[application_row()]]

    applications.delete_application(USER_ID, APPLICATION_ID)

    assert supabase.deletes == [
        ("applications", [("id", APPLICATION_ID), ("user_id", USER_ID)])
    ]
