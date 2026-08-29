"""Guarded database cleanup for symptom integration tests."""

from __future__ import annotations

import os

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import normalize_database_url

_LOCAL_HOSTS = frozenset({"localhost", "127.0.0.1", "::1", "db"})
_LOCAL_OWNER = "postgresql://careflow_owner:careflow_owner@localhost:5432/careflow"
_DELETE_ROWS = (
    "DELETE FROM note_images",
    "DELETE FROM notes",
    "DELETE FROM notify_jobs",
    "DELETE FROM booking_symptoms",
    "DELETE FROM booking_instant",
    "DELETE FROM booking_appointments",
    "DELETE FROM booking_facility_snapshots",
    "DELETE FROM bookings",
    "DELETE FROM symptom_synonyms",
    "DELETE FROM symptoms",
)


def wipe_symptom_rows() -> None:
    app_raw = os.environ.get("DATABASE_URL", "")
    if not app_raw:
        raise RuntimeError("symptom integration tests require DATABASE_URL")
    app_url = make_url(normalize_database_url(app_raw))
    if (
        app_url.host not in _LOCAL_HOSTS
        or app_url.database != "careflow"
        or app_url.username != "careflow"
    ):
        raise RuntimeError(
            "symptom tests refuse cleanup outside the local CareFlow database"
        )

    owner_raw = os.environ.get("DATABASE_ADMIN_URL") or _LOCAL_OWNER
    owner_url = normalize_database_url(owner_raw)
    parsed_owner = make_url(owner_url)
    if (
        parsed_owner.host not in _LOCAL_HOSTS
        or parsed_owner.database != "careflow"
        or parsed_owner.username != "careflow_owner"
    ):
        raise RuntimeError(
            "symptom tests require the local CareFlow owner for guarded cleanup"
        )

    engine = create_engine(owner_url, pool_pre_ping=True)
    factory = sessionmaker(bind=engine, expire_on_commit=False, class_=Session)
    session = factory()
    try:
        for statement in _DELETE_ROWS:
            session.execute(text(statement))
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
        engine.dispose()
