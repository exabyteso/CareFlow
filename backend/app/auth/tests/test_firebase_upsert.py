"""Mocked firebase_admin.auth coverage for demo Auth upsert."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from firebase_admin import auth as firebase_auth

from app.auth.firebase import _upsert_auth_user
from app.auth.seed import (
    DEMO_PASSWORD,
    DEMO_PATIENT_EMAIL,
    DEMO_PATIENT_UID,
    DEMO_STAFF_EMAIL,
    DEMO_STAFF_UID,
)

_CREATE_KWARGS = {
    "email": DEMO_PATIENT_EMAIL,
    "password": DEMO_PASSWORD,
    "email_verified": True,
    "disabled": False,
}


def _email_already_exists() -> firebase_auth.EmailAlreadyExistsError:
    return firebase_auth.EmailAlreadyExistsError(
        "The user with the provided email already exists",
        Exception("already exists"),
        None,
    )


def _missing_user(_uid: str = "") -> None:
    raise firebase_auth.UserNotFoundError("No user record found.")


def _patch_auth(monkeypatch: pytest.MonkeyPatch, **impls: object) -> dict[str, MagicMock]:
    mocks = {
        "get_user": MagicMock(),
        "create_user": MagicMock(),
        "update_user": MagicMock(),
        "delete_user": MagicMock(),
        "get_user_by_email": MagicMock(),
    }
    mocks.update(impls)
    for name, impl in mocks.items():
        monkeypatch.setattr(firebase_auth, name, impl)
    return mocks


def test_missing_uid_creates_user_and_does_not_delete(monkeypatch: pytest.MonkeyPatch):
    mocks = _patch_auth(monkeypatch, get_user=MagicMock(side_effect=_missing_user))

    _upsert_auth_user(DEMO_PATIENT_UID, DEMO_PATIENT_EMAIL, DEMO_PASSWORD)

    mocks["create_user"].assert_called_once_with(uid=DEMO_PATIENT_UID, **_CREATE_KWARGS)
    mocks["update_user"].assert_not_called()
    mocks["delete_user"].assert_not_called()


def test_existing_uid_updates_user_and_does_not_delete(monkeypatch: pytest.MonkeyPatch):
    mocks = _patch_auth(
        monkeypatch,
        get_user=MagicMock(return_value=SimpleNamespace(uid=DEMO_STAFF_UID)),
    )

    _upsert_auth_user(DEMO_STAFF_UID, DEMO_STAFF_EMAIL, DEMO_PASSWORD)

    mocks["update_user"].assert_called_once_with(
        DEMO_STAFF_UID,
        email=DEMO_STAFF_EMAIL,
        password=DEMO_PASSWORD,
        email_verified=True,
        disabled=False,
    )
    mocks["create_user"].assert_not_called()
    mocks["delete_user"].assert_not_called()


def test_email_on_different_uid_deletes_then_creates(monkeypatch: pytest.MonkeyPatch):
    colliding_uid = "other-firebase-uid"
    mocks = _patch_auth(
        monkeypatch,
        get_user=MagicMock(side_effect=_missing_user),
        create_user=MagicMock(side_effect=[_email_already_exists(), None]),
        get_user_by_email=MagicMock(
            return_value=SimpleNamespace(uid=colliding_uid),
        ),
    )

    _upsert_auth_user(DEMO_PATIENT_UID, DEMO_PATIENT_EMAIL, DEMO_PASSWORD)

    mocks["get_user_by_email"].assert_called_once_with(DEMO_PATIENT_EMAIL)
    mocks["delete_user"].assert_called_once_with(colliding_uid)
    assert mocks["create_user"].call_count == 2
    mocks["create_user"].assert_called_with(uid=DEMO_PATIENT_UID, **_CREATE_KWARGS)
    mocks["update_user"].assert_not_called()


def test_upsert_does_not_delete_for_unrelated_email(monkeypatch: pytest.MonkeyPatch):
    mocks = _patch_auth(monkeypatch)

    _upsert_auth_user(DEMO_PATIENT_UID, "unrelated@example.com", DEMO_PASSWORD)

    mocks["delete_user"].assert_not_called()
    mocks["get_user"].assert_not_called()
    mocks["create_user"].assert_not_called()
    mocks["update_user"].assert_not_called()
    mocks["get_user_by_email"].assert_not_called()
