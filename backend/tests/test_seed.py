"""Boot seed — idempotent Nairobi facilities + demo users; Firebase Auth upsert mocked."""

from unittest.mock import Mock

from sqlalchemy import text

from app.auth.seed import DEMO_PATIENT_UID, DEMO_STAFF_KMHFR, DEMO_STAFF_UID
from app.core.db import SessionLocal
from app.seed import run_boot_seed


def test_boot_seed_twice_is_idempotent(db_reset, monkeypatch):
    upsert = Mock()
    monkeypatch.setattr("app.seed.upsert_demo_auth_users", upsert)

    run_boot_seed()
    run_boot_seed()

    assert upsert.call_count == 2

    session = SessionLocal()
    try:
        operational = session.execute(
            text("SELECT COUNT(*) FROM facilities WHERE operational IS TRUE")
        ).scalar_one()
        assert operational == 6

        knh_id = session.execute(
            text("SELECT id FROM facilities WHERE kmhfr_code = :code"),
            {"code": DEMO_STAFF_KMHFR},
        ).scalar_one()

        patient_facility_id = session.execute(
            text("SELECT facility_id FROM users WHERE firebase_uid = :uid"),
            {"uid": DEMO_PATIENT_UID},
        ).scalar_one()
        assert patient_facility_id is None

        staff_facility_id = session.execute(
            text("SELECT facility_id FROM users WHERE firebase_uid = :uid"),
            {"uid": DEMO_STAFF_UID},
        ).scalar_one()
        assert staff_facility_id == knh_id
    finally:
        session.close()
