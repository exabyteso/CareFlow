"""Pytest fixtures for voice package tests (isolated FastAPI app, not app.main)."""

from __future__ import annotations

import os
import sys
from collections.abc import Generator, Iterator
from contextlib import contextmanager
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

_BACKEND_ROOT = Path(__file__).resolve().parents[3]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from app.core.config import normalize_database_url  # noqa: E402
from app.core.errors import register_exception_handlers  # noqa: E402
from app.voice.router import router as voice_router  # noqa: E402

_LOCAL_OWNER = "postgresql://careflow_owner:careflow_owner@localhost:5432/careflow"
_LOCAL_HOSTS = frozenset({"localhost", "127.0.0.1", "::1", "db"})
_DELETE_BOOKING_ROWS = (
    "DELETE FROM note_images",
    "DELETE FROM notes",
    "DELETE FROM notify_jobs",
    "DELETE FROM booking_symptoms",
    "DELETE FROM booking_instant",
    "DELETE FROM booking_appointments",
    "DELETE FROM booking_facility_snapshots",
    "DELETE FROM bookings",
)


def _guarded_owner_url() -> str:
    raw = os.environ.get("DATABASE_ADMIN_URL") or _LOCAL_OWNER
    url = normalize_database_url(raw)
    parsed = make_url(url)
    if (
        parsed.host not in _LOCAL_HOSTS
        or parsed.database != "careflow"
        or parsed.username != "careflow_owner"
    ):
        raise RuntimeError(
            "voice tests refuse owner-level cleanup outside the local CareFlow database"
        )
    return url


@contextmanager
def _owner_session() -> Iterator[Session]:
    engine = create_engine(_guarded_owner_url(), pool_pre_ping=True)
    factory = sessionmaker(bind=engine, expire_on_commit=False, class_=Session)
    session = factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
        engine.dispose()


def _wipe_booking_rows() -> None:
    with _owner_session() as session:
        for statement in _DELETE_BOOKING_ROWS:
            session.execute(text(statement))


@pytest.fixture
def voice_client() -> Generator[TestClient, None, None]:
    app = FastAPI()
    app.include_router(voice_router)
    register_exception_handlers(app)
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def _wipe_booking_rows_autouse() -> Generator[None, None, None]:
    _wipe_booking_rows()
    yield
    _wipe_booking_rows()


@pytest.fixture
def db_reset() -> None:
    """Kept for tests that request db_reset; wipe is autouse."""


@pytest.fixture
def mock_firebase_uid(monkeypatch: pytest.MonkeyPatch):
    def _set(uid: str) -> None:
        monkeypatch.setattr(
            "app.auth.firebase.verify_id_token",
            lambda token: {"uid": uid},
        )

    return _set
