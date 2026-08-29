"""Package-local booking fixtures with guarded owner access."""

from __future__ import annotations

import os
from collections.abc import Callable, Generator, Iterator
from contextlib import AbstractContextManager, contextmanager

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import normalize_database_url

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
            "booking tests refuse owner-level cleanup outside the local CareFlow database"
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


@pytest.fixture(autouse=True)
def clean_booking_rows() -> Generator[None, None, None]:
    _wipe_booking_rows()
    yield
    _wipe_booking_rows()


@pytest.fixture
def owner_session_factory() -> Callable[[], AbstractContextManager[Session]]:
    return _owner_session


@pytest.fixture
def mock_firebase_uid(monkeypatch: pytest.MonkeyPatch) -> Callable[[str], None]:
    def _set(uid: str) -> None:
        monkeypatch.setattr(
            "app.auth.firebase.verify_id_token",
            lambda token: {"uid": uid},
        )

    return _set
