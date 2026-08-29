"""Pytest fixtures for CareFlow API smoke tests.

Request sessions use DATABASE_URL (app role) only — never DATABASE_ADMIN_URL.
Alembic is applied by CI before pytest; these fixtures do not migrate.
"""

from __future__ import annotations

import sys
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

_BACKEND_ROOT = Path(__file__).resolve().parents[1]
_backend = str(_BACKEND_ROOT)
if _backend not in sys.path:
    sys.path.insert(0, _backend)

from app.core.db import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def db_reset() -> None:
    """Wipe users then facilities so recommend /me re-seed from empty tables.

    App role has DELETE, not TRUNCATE. Child product tables are empty in this
    wave (no bookings). Session uses DATABASE_URL via SessionLocal.
    """
    session = SessionLocal()
    try:
        session.execute(text("DELETE FROM users"))
        session.execute(text("DELETE FROM facilities"))
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


@pytest.fixture
def mock_firebase_uid(monkeypatch: pytest.MonkeyPatch):
    """Patch verify_id_token at the definition site (app.auth.firebase)."""

    def _set(uid: str) -> None:
        monkeypatch.setattr(
            "app.auth.firebase.verify_id_token",
            lambda token: {"uid": uid},
        )

    return _set
