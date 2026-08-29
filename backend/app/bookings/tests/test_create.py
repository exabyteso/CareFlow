"""POST /bookings against a package-local app (main.py is a P1 hub)."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.core.db import SessionLocal
from app.core.errors import register_exception_handlers
from app.bookings.router import router
from app.facilities.seed import ensure_nairobi_seed
from app.symptoms.seed import ensure_symptom_catalog

_AUTH = {"Authorization": "Bearer test-token"}

_app = FastAPI()
_app.include_router(router)
register_exception_handlers(_app)


def _seed(facility_code: str = "SEED-NBO-KNH") -> int:
    session = SessionLocal()
    try:
        ensure_nairobi_seed(session)
        ensure_symptom_catalog(session)
        session.commit()
        facility_id = session.execute(
            text("SELECT id FROM facilities WHERE kmhfr_code = :code"),
            {"code": facility_code},
        ).scalar_one()
        return int(facility_id)
    finally:
        session.close()


def test_patient_books_and_wait_increments(
    mock_firebase_uid,
    owner_session_factory,
):
    facility_id = _seed()
    mock_firebase_uid("demo-patient")
    client = TestClient(_app)

    before = SessionLocal()
    try:
        wait_before = int(
            before.execute(
                text("SELECT wait_count FROM facilities WHERE id = :id"),
                {"id": facility_id},
            ).scalar_one()
        )
    finally:
        before.close()

    response = client.post(
        "/bookings",
        headers=_AUTH,
        json={"facility_id": facility_id, "symptom_ids": ["chest-pain"]},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "booked"
    assert body["red_flag_applied"] is True
    assert body["keph_min_applied"] == 4
    assert body["symptom_ids"] == ["chest-pain"]
    assert body["facility"]["kmhfr_code"] == "SEED-NBO-KNH"
    assert body["facility"]["wait_count_at_book"] == wait_before

    with owner_session_factory() as after:
        wait_after = int(
            after.execute(
                text("SELECT wait_count FROM facilities WHERE id = :id"),
                {"id": facility_id},
            ).scalar_one()
        )
        kinds = after.execute(
            text("SELECT booking_kind::text FROM bookings WHERE id = :id"),
            {"id": body["id"]},
        ).scalar_one()
        instant = after.execute(
            text("SELECT 1 FROM booking_instant WHERE booking_id = :id"),
            {"id": body["id"]},
        ).scalar_one()
        channel = after.execute(
            text("SELECT booking_channel::text FROM bookings WHERE id = :id"),
            {"id": body["id"]},
        ).scalar_one()
        symptom_rows = after.execute(
            text(
                """
                SELECT s.slug, bs.sort_order
                FROM booking_symptoms bs
                JOIN symptoms s ON s.id = bs.symptom_id
                WHERE bs.booking_id = :id
                """
            ),
            {"id": body["id"]},
        ).all()
        snapshot = after.execute(
            text(
                """
                SELECT kmhfr_code, keph_level, wait_count_at_book
                FROM booking_facility_snapshots
                WHERE booking_id = :id
                """
            ),
            {"id": body["id"]},
        ).one()
        appointment_count = int(
            after.execute(
                text(
                    "SELECT COUNT(*) FROM booking_appointments WHERE booking_id = :id"
                ),
                {"id": body["id"]},
            ).scalar_one()
        )
    assert wait_after == wait_before + 1
    assert kinds == "instant"
    assert instant == 1
    assert channel == "ranked_recommend"
    assert symptom_rows == [("chest-pain", 0)]
    assert snapshot.kmhfr_code == "SEED-NBO-KNH"
    assert int(snapshot.keph_level) == 5
    assert int(snapshot.wait_count_at_book) == wait_before
    assert appointment_count == 0


def test_booking_rule_snapshot_uses_database_catalog(mock_firebase_uid):
    facility_id = _seed()
    session = SessionLocal()
    try:
        original = session.execute(
            text("SELECT keph_min, red_flag FROM symptoms WHERE slug = 'fever'")
        ).one()
        session.execute(
            text(
                """
                UPDATE symptoms
                SET keph_min = 4, red_flag = TRUE
                WHERE slug = 'fever'
                """
            )
        )
        session.commit()
    finally:
        session.close()

    mock_firebase_uid("demo-patient")
    try:
        response = TestClient(_app).post(
            "/bookings",
            headers=_AUTH,
            json={"facility_id": facility_id, "symptom_ids": ["fever"]},
        )
        assert response.status_code == 200, response.text
        assert response.json()["keph_min_applied"] == 4
        assert response.json()["red_flag_applied"] is True
    finally:
        session = SessionLocal()
        try:
            session.execute(
                text(
                    """
                    UPDATE symptoms
                    SET keph_min = :keph_min, red_flag = :red_flag
                    WHERE slug = 'fever'
                    """
                ),
                {
                    "keph_min": int(original.keph_min),
                    "red_flag": bool(original.red_flag),
                },
            )
            session.commit()
        finally:
            session.close()


def test_staff_cannot_book(mock_firebase_uid):
    facility_id = _seed()
    mock_firebase_uid("demo-staff")
    client = TestClient(_app)
    response = client.post(
        "/bookings",
        headers=_AUTH,
        json={"facility_id": facility_id, "symptom_ids": ["fever"]},
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"


def test_unknown_symptom_422(mock_firebase_uid):
    facility_id = _seed()
    mock_firebase_uid("demo-patient")
    client = TestClient(_app)
    response = client.post(
        "/bookings",
        headers=_AUTH,
        json={"facility_id": facility_id, "symptom_ids": ["not-a-real-slug"]},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "unknown_symptom"


def test_red_flag_cannot_book_below_required_keph(
    mock_firebase_uid,
    owner_session_factory,
):
    facility_id = _seed("SEED-NBO-KANG")
    mock_firebase_uid("demo-patient")
    client = TestClient(_app)

    with owner_session_factory() as before:
        wait_before = int(
            before.execute(
                text("SELECT wait_count FROM facilities WHERE id = :id"),
                {"id": facility_id},
            ).scalar_one()
        )

    response = client.post(
        "/bookings",
        headers=_AUTH,
        json={"facility_id": facility_id, "symptom_ids": ["chest-pain"]},
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "facility_below_keph_min"
    with owner_session_factory() as after:
        wait_after = int(
            after.execute(
                text("SELECT wait_count FROM facilities WHERE id = :id"),
                {"id": facility_id},
            ).scalar_one()
        )
        booking_count = int(
            after.execute(text("SELECT COUNT(*) FROM bookings")).scalar_one()
        )
    assert wait_after == wait_before
    assert booking_count == 0


def test_failure_after_parent_insert_rolls_back_transaction(
    mock_firebase_uid,
    monkeypatch,
    owner_session_factory,
):
    from app.bookings.create import create_instant_booking as real_create

    facility_id = _seed()
    mock_firebase_uid("demo-patient")
    with owner_session_factory() as before:
        wait_before = int(
            before.execute(
                text("SELECT wait_count FROM facilities WHERE id = :id"),
                {"id": facility_id},
            ).scalar_one()
        )

    def create_with_invalid_map_score(session, **kwargs):
        return real_create(
            session,
            **kwargs,
            map_scores={"chest-pain": 2.0},
        )

    monkeypatch.setattr(
        "app.bookings.router.create_instant_booking",
        create_with_invalid_map_score,
    )
    response = TestClient(_app, raise_server_exceptions=False).post(
        "/bookings",
        headers=_AUTH,
        json={"facility_id": facility_id, "symptom_ids": ["chest-pain"]},
    )

    assert response.status_code == 500
    with owner_session_factory() as after:
        wait_after = int(
            after.execute(
                text("SELECT wait_count FROM facilities WHERE id = :id"),
                {"id": facility_id},
            ).scalar_one()
        )
        counts = {
            table: int(
                after.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar_one()
            )
            for table in (
                "bookings",
                "booking_instant",
                "booking_symptoms",
                "booking_facility_snapshots",
            )
        }
    assert wait_after == wait_before
    assert counts == {
        "bookings": 0,
        "booking_instant": 0,
        "booking_symptoms": 0,
        "booking_facility_snapshots": 0,
    }


def test_duplicate_symptoms_are_stored_once(mock_firebase_uid, owner_session_factory):
    facility_id = _seed()
    mock_firebase_uid("demo-patient")
    client = TestClient(_app)

    response = client.post(
        "/bookings",
        headers=_AUTH,
        json={
            "facility_id": facility_id,
            "symptom_ids": ["chest-pain", " chest-pain "],
        },
    )

    assert response.status_code == 200, response.text
    assert response.json()["symptom_ids"] == ["chest-pain"]
    with owner_session_factory() as session:
        symptom_count = int(
            session.execute(
                text(
                    "SELECT COUNT(*) FROM booking_symptoms WHERE booking_id = :id"
                ),
                {"id": response.json()["id"]},
            ).scalar_one()
        )
    assert symptom_count == 1


def test_missing_bearer_is_unauthorized():
    client = TestClient(_app)
    response = client.post(
        "/bookings",
        json={"facility_id": 1, "symptom_ids": ["fever"]},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


def test_invalid_locale_is_rejected(mock_firebase_uid):
    facility_id = _seed()
    mock_firebase_uid("demo-patient")
    client = TestClient(_app)
    response = client.post(
        "/bookings",
        headers=_AUTH,
        json={
            "facility_id": facility_id,
            "symptom_ids": ["fever"],
            "notify_locale": "fr",
        },
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_symptom_ids_are_bounded(mock_firebase_uid):
    facility_id = _seed()
    mock_firebase_uid("demo-patient")
    client = TestClient(_app)
    response = client.post(
        "/bookings",
        headers=_AUTH,
        json={
            "facility_id": facility_id,
            "symptom_ids": [f"symptom-{index}" for index in range(21)],
        },
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


@pytest.mark.parametrize(
    "invalid_symptom_id",
    [" ", "Chest-Pain", "chest_pain", "a" * 101],
)
def test_symptom_id_format_is_validated(mock_firebase_uid, invalid_symptom_id):
    facility_id = _seed()
    mock_firebase_uid("demo-patient")
    response = TestClient(_app).post(
        "/bookings",
        headers=_AUTH,
        json={
            "facility_id": facility_id,
            "symptom_ids": [invalid_symptom_id],
        },
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
