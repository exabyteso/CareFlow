"""Pytest fixtures for notes package tests."""

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

from app.auth.seed import ensure_demo_users  # noqa: E402
from app.core.config import normalize_database_url  # noqa: E402
from app.core.db import SessionLocal  # noqa: E402
from app.core.errors import register_exception_handlers  # noqa: E402
from app.core.rls import set_rls_gucs  # noqa: E402
from app.notes.router import router as notes_router  # noqa: E402

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
            "notes tests refuse owner-level cleanup outside the local CareFlow database"
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
def notes_client() -> Generator[TestClient, None, None]:
    app = FastAPI()
    app.include_router(notes_router)
    register_exception_handlers(app)
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def db_reset() -> None:
    _wipe_booking_rows()


@pytest.fixture
def mock_firebase_uid(monkeypatch: pytest.MonkeyPatch):
    def _set(uid: str) -> None:
        monkeypatch.setattr(
            "app.auth.firebase.verify_id_token",
            lambda token: {"uid": token if uid == "passthrough" else uid},
        )

    return _set


@pytest.fixture
def sample_booking_id(db_reset: None) -> int:
    session = SessionLocal()
    try:
        ensure_demo_users(session)
        session.execute(
            text(
                """
                INSERT INTO symptoms (slug, keph_min, red_flag, active)
                VALUES ('headache', 3, false, true)
                ON CONFLICT (slug) DO NOTHING
                """
            )
        )
        symptom_id = session.execute(
            text("SELECT id FROM symptoms WHERE slug = 'headache'")
        ).scalar_one()

        facility = session.execute(
            text("SELECT id, kmhfr_code, name, keph_level, lat, lng, county, wait_count FROM facilities WHERE kmhfr_code = 'SEED-NBO-KNH'")
        ).mappings().one()
        patient_id = session.execute(
            text("SELECT id FROM users WHERE firebase_uid = 'demo-patient'")
        ).scalar_one()

        set_rls_gucs(
            session, user_id=int(patient_id), role="patient", facility_id=None
        )

        booking_id = session.execute(
            text(
                """
                INSERT INTO bookings (
                    facility_id, patient_user_id, booking_kind, booking_channel,
                    status, notify_locale, keph_min_applied, red_flag_applied
                )
                VALUES (
                    :facility_id, :patient_id,
                    'instant', 'ranked_recommend',
                    'booked', 'en', 3, false
                )
                RETURNING id
                """
            ),
            {"facility_id": facility["id"], "patient_id": patient_id},
        ).scalar_one()

        session.execute(
            text("INSERT INTO booking_instant (booking_id) VALUES (:id)"),
            {"id": booking_id},
        )
        session.execute(
            text(
                """
                INSERT INTO booking_symptoms (booking_id, symptom_id, map_score, sort_order)
                VALUES (:booking_id, :symptom_id, 0.9, 0)
                """
            ),
            {"booking_id": booking_id, "symptom_id": symptom_id},
        )
        session.execute(
            text(
                """
                INSERT INTO booking_facility_snapshots (
                    booking_id, kmhfr_code, name, keph_level, lat, lng, county, wait_count_at_book
                )
                VALUES (
                    :booking_id, :kmhfr_code, :name, :keph_level, :lat, :lng, :county, :wait_count
                )
                """
            ),
            {
                "booking_id": booking_id,
                "kmhfr_code": facility["kmhfr_code"],
                "name": facility["name"],
                "keph_level": facility["keph_level"],
                "lat": facility["lat"],
                "lng": facility["lng"],
                "county": facility["county"],
                "wait_count": facility["wait_count"],
            },
        )
        session.commit()
        return int(booking_id)
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
