"""Insert/delete helpers for hospital desk tests (not pytest fixtures)."""

from __future__ import annotations

from sqlalchemy import text

from app.auth.seed import ensure_demo_users
from app.core.db import SessionLocal
from app.core.rls import set_rls_gucs


def insert_instant_booking(
    *,
    facility_id: int,
    slug: str = "p4-test-cough",
    red_flag: bool = False,
) -> int:
    """Insert one instant booked row as the demo patient (RLS insert policy)."""
    session = SessionLocal()
    try:
        ensure_demo_users(session)
        session.commit()

        patient = session.execute(
            text("SELECT id FROM users WHERE firebase_uid = 'demo-patient'")
        ).first()
        assert patient is not None
        patient_id = int(patient.id)

        symptom = session.execute(
            text(
                """
                INSERT INTO symptoms (slug, keph_min, red_flag)
                VALUES (:slug, 2, :red_flag)
                ON CONFLICT (slug) DO UPDATE
                  SET keph_min = EXCLUDED.keph_min
                RETURNING id
                """
            ),
            {"slug": slug, "red_flag": red_flag},
        ).first()
        assert symptom is not None
        session.commit()

        set_rls_gucs(
            session, user_id=patient_id, role="patient", facility_id=None
        )
        booking_id = session.execute(
            text(
                """
                INSERT INTO bookings (
                  facility_id,
                  patient_user_id,
                  booking_kind,
                  booking_channel,
                  status,
                  notify_locale,
                  keph_min_applied,
                  red_flag_applied
                )
                VALUES (
                  :facility_id,
                  :patient_id,
                  CAST('instant' AS booking_kind),
                  CAST('ranked_recommend' AS booking_channel),
                  CAST('booked' AS booking_status),
                  CAST('en' AS notify_locale),
                  2,
                  :red_flag
                )
                RETURNING id
                """
            ),
            {
                "facility_id": facility_id,
                "patient_id": patient_id,
                "red_flag": red_flag,
            },
        ).scalar_one()
        session.execute(
            text("INSERT INTO booking_instant (booking_id) VALUES (:id)"),
            {"id": booking_id},
        )
        session.execute(
            text(
                """
                INSERT INTO booking_symptoms (booking_id, symptom_id, sort_order)
                VALUES (:booking_id, :symptom_id, 0)
                """
            ),
            {"booking_id": booking_id, "symptom_id": int(symptom.id)},
        )
        session.commit()
        return int(booking_id)
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def other_facility_id(staff_facility_id: int) -> int:
    session = SessionLocal()
    try:
        ensure_demo_users(session)
        session.commit()
        row = session.execute(
            text(
                """
                SELECT id FROM facilities
                WHERE id <> :staff_id
                ORDER BY id
                LIMIT 1
                """
            ),
            {"staff_id": staff_facility_id},
        ).first()
        assert row is not None
        return int(row.id)
    finally:
        session.close()


def set_wait_count(facility_id: int, wait_count: int) -> None:
    session = SessionLocal()
    try:
        session.execute(
            text("UPDATE facilities SET wait_count = :n WHERE id = :id"),
            {"n": wait_count, "id": facility_id},
        )
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def read_wait_count(facility_id: int) -> int:
    session = SessionLocal()
    try:
        row = session.execute(
            text("SELECT wait_count FROM facilities WHERE id = :id"),
            {"id": facility_id},
        ).first()
        assert row is not None
        return int(row.wait_count)
    finally:
        session.close()


def delete_booking(booking_id: int) -> None:
    session = SessionLocal()
    try:
        session.execute(
            text("DELETE FROM booking_symptoms WHERE booking_id = :id"),
            {"id": booking_id},
        )
        session.execute(
            text("DELETE FROM booking_instant WHERE booking_id = :id"),
            {"id": booking_id},
        )
        session.execute(
            text("DELETE FROM booking_facility_snapshots WHERE booking_id = :id"),
            {"id": booking_id},
        )
        session.execute(
            text("DELETE FROM bookings WHERE id = :id"),
            {"id": booking_id},
        )
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
