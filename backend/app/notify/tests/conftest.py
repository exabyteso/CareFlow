"""Pytest fixtures for notify service tests."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
from sqlalchemy import text

_BACKEND_ROOT = Path(__file__).resolve().parents[3]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from app.auth.seed import ensure_demo_users  # noqa: E402
from app.core.db import SessionLocal  # noqa: E402


@pytest.fixture
def db_reset() -> None:
    session = SessionLocal()
    try:
        session.execute(text("DELETE FROM notify_jobs"))
        session.execute(text("DELETE FROM booking_facility_snapshots"))
        session.execute(text("DELETE FROM booking_symptoms"))
        session.execute(text("DELETE FROM booking_instant"))
        session.execute(text("DELETE FROM bookings"))
        session.execute(text("DELETE FROM symptom_synonyms"))
        session.execute(text("DELETE FROM symptoms"))
        session.execute(text("DELETE FROM users"))
        session.execute(text("DELETE FROM facilities"))
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


@pytest.fixture
def sample_booking_id(db_reset: None) -> int:
    session = SessionLocal()
    try:
        ensure_demo_users(session)
        session.execute(
            text(
                """
                INSERT INTO symptoms (slug, keph_min, red_flag, active)
                VALUES ('fever', 3, false, true)
                ON CONFLICT (slug) DO NOTHING
                """
            )
        )
        symptom_id = session.execute(
            text("SELECT id FROM symptoms WHERE slug = 'fever'")
        ).scalar_one()
        facility = session.execute(
            text(
                "SELECT id, kmhfr_code, name, keph_level, lat, lng, county, wait_count "
                "FROM facilities WHERE kmhfr_code = 'SEED-NBO-KNH'"
            )
        ).mappings().one()
        patient_id = session.execute(
            text("SELECT id FROM users WHERE firebase_uid = 'demo-patient'")
        ).scalar_one()
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
                VALUES (:booking_id, :symptom_id, 0.8, 0)
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
