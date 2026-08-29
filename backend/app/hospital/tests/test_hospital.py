"""Hospital desk: staff isolation, wait PATCH, arrived/no-show decrement."""

from app.hospital.tests.helpers import (
    delete_booking,
    insert_instant_booking,
    other_facility_id,
    read_wait_count,
    set_wait_count,
)

_AUTH = {"Authorization": "Bearer test-token"}


def test_queue_missing_auth_returns_401(client):
    response = client.get("/hospital/queue")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


def test_queue_patient_returns_403(client, mock_firebase_uid, staff_facility_id):
    mock_firebase_uid("demo-patient")
    response = client.get("/hospital/queue", headers=_AUTH)
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"


def test_queue_staff_sees_own_facility_only(
    client, mock_firebase_uid, staff_facility_id
):
    mock_firebase_uid("demo-staff")
    own_id = insert_instant_booking(
        facility_id=staff_facility_id, slug="p4-test-own-queue"
    )
    other_id = insert_instant_booking(
        facility_id=other_facility_id(staff_facility_id),
        slug="p4-test-other-queue",
    )
    try:
        set_wait_count(staff_facility_id, 4)
        response = client.get("/hospital/queue", headers=_AUTH)
        assert response.status_code == 200
        body = response.json()
        assert body["facility"]["id"] == staff_facility_id
        assert body["facility"]["wait_count"] == 4
        ids = {row["id"] for row in body["bookings"]}
        assert own_id in ids
        assert other_id not in ids
        own = next(row for row in body["bookings"] if row["id"] == own_id)
        assert own["status"] == "booked"
        assert own["phone_last4"] == "1111"
        assert "p4-test-own-queue" in own["symptom_slugs"]
        assert own["queue_position"] is not None
    finally:
        delete_booking(own_id)
        delete_booking(other_id)


def test_patch_wait_count_staff_override(
    client, mock_firebase_uid, staff_facility_id
):
    mock_firebase_uid("demo-staff")
    other_id = other_facility_id(staff_facility_id)
    set_wait_count(staff_facility_id, 3)
    set_wait_count(other_id, 9)
    response = client.patch(
        "/hospital/wait-count",
        headers=_AUTH,
        json={"wait_count": 0},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["facility_id"] == staff_facility_id
    assert body["wait_count"] == 0
    assert read_wait_count(staff_facility_id) == 0
    assert read_wait_count(other_id) == 9


def test_patch_wait_count_negative_422(
    client, mock_firebase_uid, staff_facility_id
):
    mock_firebase_uid("demo-staff")
    response = client.patch(
        "/hospital/wait-count",
        headers=_AUTH,
        json={"wait_count": -1},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_arrived_decrements_wait_once(
    client, mock_firebase_uid, staff_facility_id
):
    mock_firebase_uid("demo-staff")
    booking_id = insert_instant_booking(
        facility_id=staff_facility_id, slug="p4-test-arrived"
    )
    try:
        set_wait_count(staff_facility_id, 5)
        first = client.post(
            f"/hospital/bookings/{booking_id}/arrived",
            headers=_AUTH,
        )
        assert first.status_code == 200
        body = first.json()
        assert body["booking"]["status"] == "arrived"
        assert body["wait_count"] == 4
        assert read_wait_count(staff_facility_id) == 4

        second = client.post(
            f"/hospital/bookings/{booking_id}/arrived",
            headers=_AUTH,
        )
        assert second.status_code == 200
        assert second.json()["booking"]["status"] == "arrived"
        assert second.json()["wait_count"] == 4
        assert read_wait_count(staff_facility_id) == 4
    finally:
        delete_booking(booking_id)


def test_no_show_decrements_wait_and_blocks_arrived(
    client, mock_firebase_uid, staff_facility_id
):
    mock_firebase_uid("demo-staff")
    booking_id = insert_instant_booking(
        facility_id=staff_facility_id, slug="p4-test-noshow"
    )
    try:
        set_wait_count(staff_facility_id, 2)
        response = client.post(
            f"/hospital/bookings/{booking_id}/no-show",
            headers=_AUTH,
        )
        assert response.status_code == 200
        assert response.json()["booking"]["status"] == "no_show"
        assert response.json()["wait_count"] == 1
        assert read_wait_count(staff_facility_id) == 1

        conflict = client.post(
            f"/hospital/bookings/{booking_id}/arrived",
            headers=_AUTH,
        )
        assert conflict.status_code == 409
        assert conflict.json()["error"]["code"] == "conflict"
        assert read_wait_count(staff_facility_id) == 1
    finally:
        delete_booking(booking_id)


def test_arrived_other_facility_404_does_not_decrement(
    client, mock_firebase_uid, staff_facility_id
):
    mock_firebase_uid("demo-staff")
    other_id = other_facility_id(staff_facility_id)
    booking_id = insert_instant_booking(
        facility_id=other_id, slug="p4-test-foreign"
    )
    try:
        set_wait_count(staff_facility_id, 6)
        set_wait_count(other_id, 8)
        response = client.post(
            f"/hospital/bookings/{booking_id}/arrived",
            headers=_AUTH,
        )
        assert response.status_code == 404
        assert response.json()["error"]["code"] == "not_found"
        assert read_wait_count(staff_facility_id) == 6
        assert read_wait_count(other_id) == 8
    finally:
        delete_booking(booking_id)


def test_arrived_never_goes_negative(
    client, mock_firebase_uid, staff_facility_id
):
    mock_firebase_uid("demo-staff")
    booking_id = insert_instant_booking(
        facility_id=staff_facility_id, slug="p4-test-zero-wait"
    )
    try:
        set_wait_count(staff_facility_id, 0)
        response = client.post(
            f"/hospital/bookings/{booking_id}/arrived",
            headers=_AUTH,
        )
        assert response.status_code == 200
        assert response.json()["booking"]["status"] == "arrived"
        assert response.json()["wait_count"] == 0
        assert read_wait_count(staff_facility_id) == 0
    finally:
        delete_booking(booking_id)
