"""FastAPI dependencies: Bearer token, current user, RLS GUCs."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated, Any

from fastapi import Depends, Header, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import app.auth.firebase as firebase_tokens
from app.auth.seed import (
    DEMO_PATIENT_UID,
    DEMO_STAFF_UID,
    KE_MOBILE_E164_RE,
    ensure_demo_users,
    synthetic_patient_phone,
)
from app.core.db import get_db
from app.core.rls import set_rls_gucs

_DEMO_UIDS = frozenset({DEMO_PATIENT_UID, DEMO_STAFF_UID})
_PHONE_UNIQUE_ATTEMPTS = 5
_PHONE_UNIQUE_CONSTRAINT = "users_phone_e164_unique"


@dataclass(frozen=True, slots=True)
class CurrentUser:
    id: int
    firebase_uid: str
    role: str
    facility_id: int | None
    ui_locale: str
    phone_e164: str


def _unauthorized(message: str = "Missing or invalid Firebase ID token.") -> HTTPException:
    return HTTPException(
        status_code=401,
        detail={"code": "unauthorized", "message": message},
    )


def _not_provisioned() -> HTTPException:
    return HTTPException(
        status_code=404,
        detail={
            "code": "user_not_provisioned",
            "message": "No CareFlow user is provisioned for this Firebase account.",
        },
    )


def get_bearer_token(
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    if authorization is None:
        raise _unauthorized()
    scheme, _, param = authorization.partition(" ")
    token = param.strip()
    if scheme.lower() != "bearer" or not token:
        raise _unauthorized()
    return token


def _pg_str(value: object) -> str:
    inner = getattr(value, "value", value)
    return str(inner)


def _load_user(session: Session, uid: str):
    return session.execute(
        text(
            """
            SELECT id, firebase_uid, role, facility_id, ui_locale, phone_e164
            FROM users
            WHERE firebase_uid = :uid
            """
        ),
        {"uid": uid},
    ).mappings().first()


def _is_phone_e164_unique_violation(exc: IntegrityError) -> bool:
    orig = exc.orig
    if orig is None:
        return False
    diag = getattr(orig, "diag", None)
    constraint = getattr(diag, "constraint_name", None) if diag is not None else None
    if constraint == _PHONE_UNIQUE_CONSTRAINT:
        return True
    pgcode = getattr(orig, "pgcode", None)
    if pgcode != "23505":
        return False
    msg = str(orig)
    return "phone_e164" in msg or _PHONE_UNIQUE_CONSTRAINT in msg


def _phone_for_patient(uid: str, decoded: dict[str, Any], attempt: int) -> str:
    if attempt == 0:
        raw = decoded.get("phone_number")
        if isinstance(raw, str) and KE_MOBILE_E164_RE.fullmatch(raw):
            return raw
    return synthetic_patient_phone(uid, attempt)


def _auto_provision_patient(session: Session, uid: str, decoded: dict[str, Any]) -> None:
    """Insert a care-seeker row for an unknown Firebase UID. Staff stay invite-only."""
    for attempt in range(_PHONE_UNIQUE_ATTEMPTS):
        phone = _phone_for_patient(uid, decoded, attempt)
        try:
            with session.begin_nested():
                session.execute(
                    text(
                        """
                        INSERT INTO users (
                            firebase_uid, role, phone_e164, ui_locale, facility_id
                        )
                        VALUES (
                            :uid,
                            CAST(:role AS user_role),
                            :phone,
                            CAST(:locale AS ui_locale),
                            NULL
                        )
                        ON CONFLICT (firebase_uid) DO NOTHING
                        """
                    ),
                    {
                        "uid": uid,
                        "role": "patient",
                        "phone": phone,
                        "locale": "en",
                    },
                )
            return
        except IntegrityError as exc:
            if _is_phone_e164_unique_violation(exc):
                continue
            return


def get_current_user(
    token: Annotated[str, Depends(get_bearer_token)],
    session: Annotated[Session, Depends(get_db)],
) -> CurrentUser:
    """Verify Firebase ID token, seed demo rows, load ``users``, set RLS GUCs."""
    try:
        decoded = firebase_tokens.verify_id_token(token)
    except firebase_tokens.FirebaseAuthError as exc:
        raise _unauthorized() from exc

    uid = decoded.get("uid") or decoded.get("sub")
    if not isinstance(uid, str) or not uid.strip():
        raise _unauthorized()
    uid = uid.strip()

    ensure_demo_users(session)

    row = _load_user(session, uid)
    if row is None and uid not in _DEMO_UIDS:
        _auto_provision_patient(session, uid, decoded)
        row = _load_user(session, uid)

    if row is None:
        raise _not_provisioned()

    facility_id = row["facility_id"]
    if facility_id is not None:
        facility_id = int(facility_id)

    user = CurrentUser(
        id=int(row["id"]),
        firebase_uid=str(row["firebase_uid"]),
        role=_pg_str(row["role"]),
        facility_id=facility_id,
        ui_locale=_pg_str(row["ui_locale"]),
        phone_e164=str(row["phone_e164"]),
    )
    set_rls_gucs(
        session,
        user_id=user.id,
        role=user.role,
        facility_id=user.facility_id,
    )
    return user
