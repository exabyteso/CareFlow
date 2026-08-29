"""Firebase Admin ID-token verification.

Wave 3 tests monkeypatch ``app.auth.firebase.verify_id_token`` — routes and
deps must call this function, never ``firebase_admin.auth.verify_id_token``.
"""

from __future__ import annotations

import logging
import threading

from app.core.config import get_settings, pem_shape_diagnostics

logger = logging.getLogger(__name__)

_init_lock = threading.Lock()
_app_ready = False


class FirebaseAuthError(Exception):
    """ID token missing, invalid, or Admin SDK not configured."""


def _credentials_configured() -> bool:
    settings = get_settings()
    return bool(
        settings.firebase_project_id
        and settings.firebase_client_email
        and settings.firebase_private_key
    )


def _pem_diag() -> str:
    return pem_shape_diagnostics(get_settings().firebase_private_key)


def _ensure_firebase_app() -> None:
    """Lazy-init firebase_admin once when project_id + client_email + private_key are set."""
    global _app_ready
    if _app_ready:
        return
    with _init_lock:
        if _app_ready:
            return
        if not _credentials_configured():
            raise FirebaseAuthError("Firebase Admin credentials are not configured.")

        from firebase_admin import credentials, get_app, initialize_app

        try:
            get_app()
        except ValueError:
            try:
                settings = get_settings()
                cred = credentials.Certificate(
                    {
                        "type": "service_account",
                        "project_id": settings.firebase_project_id,
                        "private_key": settings.firebase_private_key,
                        "client_email": settings.firebase_client_email,
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                )
                initialize_app(
                    cred,
                    options={"projectId": settings.firebase_project_id},
                )
            except Exception as exc:
                raise FirebaseAuthError(
                    "Firebase Admin could not be initialized."
                ) from exc
        _app_ready = True


def verify_id_token(token: str) -> dict:
    """Verify a Firebase ID token and return decoded claims (includes ``uid``).

    Raises FirebaseAuthError when credentials are missing or the token is invalid.
    Never logs ``token`` or the private key.
    """
    if not token or not str(token).strip():
        raise FirebaseAuthError("Missing Firebase ID token.")

    _ensure_firebase_app()

    from firebase_admin import auth

    try:
        decoded = auth.verify_id_token(token)
    except Exception as exc:
        raise FirebaseAuthError("Invalid Firebase ID token.") from exc

    if not isinstance(decoded, dict):
        raise FirebaseAuthError("Invalid Firebase ID token.")
    return decoded


def firebase_admin_configured() -> bool:
    """True when Admin SDK project_id, client_email, and private_key are all set."""
    return _credentials_configured()


def upsert_demo_auth_users() -> None:
    """Create or update demo Firebase Auth users (custom UIDs).

    No-op when Admin credentials are missing (does not call ``_ensure_firebase_app``).
    Logs and returns on init or upsert failure so boot seed can keep Postgres rows.
    Never logs passwords or private keys.
    """
    if not _credentials_configured():
        logger.info(
            "Firebase Admin credentials are not configured; skipping demo Auth upsert."
        )
        return

    try:
        _ensure_firebase_app()
    except Exception as exc:
        logger.warning(
            "Firebase Admin could not be initialized (%s); skipping demo Auth upsert. %s",
            type(exc).__name__,
            _pem_diag(),
        )
        return

    from app.auth.seed import (
        DEMO_PASSWORD,
        DEMO_PATIENT_EMAIL,
        DEMO_PATIENT_UID,
        DEMO_STAFF_EMAIL,
        DEMO_STAFF_UID,
    )

    for uid, email in (
        (DEMO_PATIENT_UID, DEMO_PATIENT_EMAIL),
        (DEMO_STAFF_UID, DEMO_STAFF_EMAIL),
    ):
        try:
            _upsert_auth_user(uid, email, DEMO_PASSWORD)
        except Exception as exc:
            logger.warning(
                "Firebase Auth upsert failed for uid=%s (%s). %s",
                uid,
                type(exc).__name__,
                _pem_diag(),
            )


def _upsert_auth_user(uid: str, email: str, password: str) -> None:
    """Create or update a demo Firebase Auth user (custom UID).

    Custom UIDs and email reclaim apply only to the two demo identities.
    """
    from firebase_admin import auth

    from app.auth.seed import (
        DEMO_PATIENT_EMAIL,
        DEMO_PATIENT_UID,
        DEMO_STAFF_EMAIL,
        DEMO_STAFF_UID,
    )

    demo_uids = {DEMO_PATIENT_UID, DEMO_STAFF_UID}
    demo_emails = {DEMO_PATIENT_EMAIL, DEMO_STAFF_EMAIL}
    if uid not in demo_uids or email not in demo_emails:
        return

    kwargs = {
        "email": email,
        "password": password,
        "email_verified": True,
        "disabled": False,
    }

    try:
        auth.get_user(uid)
        uid_exists = True
    except auth.UserNotFoundError:
        uid_exists = False

    try:
        if uid_exists:
            auth.update_user(uid, **kwargs)
        else:
            auth.create_user(uid=uid, **kwargs)
    except auth.EmailAlreadyExistsError:
        if email not in demo_emails:
            raise
        colliding = auth.get_user_by_email(email)
        if colliding.uid == uid:
            auth.update_user(uid, **kwargs)
            return
        auth.delete_user(colliding.uid)
        try:
            auth.get_user(uid)
        except auth.UserNotFoundError:
            auth.create_user(uid=uid, **kwargs)
            return
        auth.update_user(uid, **kwargs)
