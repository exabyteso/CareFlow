"""Notes routes — staff facility isolation and patient denial."""

from __future__ import annotations

_AUTH = {"Authorization": "Bearer test-token"}


def test_patient_cannot_create_note(
    notes_client, db_reset, mock_firebase_uid, sample_booking_id
):
    mock_firebase_uid("demo-patient")
    response = notes_client.post(
        f"/hospital/bookings/{sample_booking_id}/notes",
        headers=_AUTH,
        json={"body_text": "Should fail"},
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"


def test_patient_cannot_list_notes(
    notes_client, db_reset, mock_firebase_uid, sample_booking_id
):
    mock_firebase_uid("demo-patient")
    response = notes_client.get(
        f"/hospital/bookings/{sample_booking_id}/notes",
        headers=_AUTH,
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"


def test_staff_creates_note(
    notes_client, db_reset, mock_firebase_uid, sample_booking_id
):
    mock_firebase_uid("demo-staff")
    response = notes_client.post(
        f"/hospital/bookings/{sample_booking_id}/notes",
        headers=_AUTH,
        json={
            "body_text": "Patient stable.",
            "audio_transcript": "Stable vitals.",
            "images": [{"image_url": "https://example.com/rx.jpg", "ocr_text": "Paracetamol"}],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["booking_id"] == sample_booking_id
    assert body["body_text"] == "Patient stable."
    assert len(body["images"]) == 1


def test_staff_lists_notes(
    notes_client, db_reset, mock_firebase_uid, sample_booking_id
):
    mock_firebase_uid("demo-staff")
    notes_client.post(
        f"/hospital/bookings/{sample_booking_id}/notes",
        headers=_AUTH,
        json={"body_text": "First note"},
    )
    response = notes_client.get(
        f"/hospital/bookings/{sample_booking_id}/notes",
        headers=_AUTH,
    )
    assert response.status_code == 200
    notes = response.json()["notes"]
    assert len(notes) == 1
    assert notes[0]["body_text"] == "First note"


def test_empty_note_422(notes_client, db_reset, mock_firebase_uid, sample_booking_id):
    mock_firebase_uid("demo-staff")
    response = notes_client.post(
        f"/hospital/bookings/{sample_booking_id}/notes",
        headers=_AUTH,
        json={},
    )
    assert response.status_code == 422


def test_whitespace_only_note_422(
    notes_client, db_reset, mock_firebase_uid, sample_booking_id
):
    mock_firebase_uid("demo-staff")
    response = notes_client.post(
        f"/hospital/bookings/{sample_booking_id}/notes",
        headers=_AUTH,
        json={"body_text": "   ", "audio_transcript": "\n"},
    )
    assert response.status_code == 422
