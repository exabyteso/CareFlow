"""Pytest fixtures for voice package tests (router mounted on main app)."""

from __future__ import annotations

import sys
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

_BACKEND_ROOT = Path(__file__).resolve().parents[3]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from app.core.db import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.voice.router import router as voice_router  # noqa: E402

# P5 mounts locally until P1 hub wiring lands on main.
if not any(getattr(route, "path", "") == "/voice/stt" for route in app.routes):
    app.include_router(voice_router)


@pytest.fixture
def voice_client() -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def db_reset() -> None:
    session = SessionLocal()
    try:
        session.execute(text("DELETE FROM note_images"))
        session.execute(text("DELETE FROM notes"))
        session.execute(text("DELETE FROM notify_jobs"))
        session.execute(text("DELETE FROM booking_facility_snapshots"))
        session.execute(text("DELETE FROM booking_symptoms"))
        session.execute(text("DELETE FROM booking_instant"))
        session.execute(text("DELETE FROM booking_appointments"))
        session.execute(text("DELETE FROM bookings"))
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
    def _set(uid: str) -> None:
        monkeypatch.setattr(
            "app.auth.firebase.verify_id_token",
            lambda token: {"uid": uid},
        )

    return _set
