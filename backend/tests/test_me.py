"""GET /me — 401 / 200 patient (seeded + auto-provision) and staff."""

import re
import uuid

_AUTH = {"Authorization": "Bearer test-token"}
_KE_MOBILE = re.compile(r"^\+254[17][0-9]{8}$")
_SEEDED_PHONES = {"+254711111111", "+254722222222"}


def test_me_missing_auth_returns_401(client):
    response = client.get("/me")
    assert response.status_code == 401
    error = response.json()["error"]
    assert error["code"] == "unauthorized"
    assert "message" in error


def test_me_garbage_token_returns_401(client):
    response = client.get("/me", headers=_AUTH)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


def test_me_unknown_uid_auto_provisions_patient(client, mock_firebase_uid):
    unknown_uid = f"not-a-provisioned-user-{uuid.uuid4()}"
    mock_firebase_uid(unknown_uid)
    first = client.get("/me", headers=_AUTH)
    assert first.status_code == 200
    body = first.json()
    assert body["firebase_uid"] == unknown_uid
    assert body["role"] == "patient"
    assert body["facility_id"] is None
    assert body["locale"] == "en"
    assert _KE_MOBILE.match(body["phone_e164"])
    assert body["phone_e164"] not in _SEEDED_PHONES

    second = client.get("/me", headers=_AUTH)
    assert second.status_code == 200
    again = second.json()
    assert again["phone_e164"] == body["phone_e164"]
    assert again["firebase_uid"] == body["firebase_uid"]
    assert again["role"] == body["role"]
    assert again == body


def test_me_patient_200(client, mock_firebase_uid):
    mock_firebase_uid("demo-patient")
    response = client.get("/me", headers=_AUTH)
    assert response.status_code == 200
    body = response.json()
    assert body["firebase_uid"] == "demo-patient"
    assert body["role"] == "patient"
    assert body["facility_id"] is None
    assert body["locale"] == "en"
    assert body["phone_e164"] == "+254711111111"


def test_me_staff_200_with_facility_id(client, mock_firebase_uid):
    mock_firebase_uid("demo-staff")
    response = client.get("/me", headers=_AUTH)
    assert response.status_code == 200
    body = response.json()
    assert body["firebase_uid"] == "demo-staff"
    assert body["role"] == "hospital_staff"
    assert isinstance(body["facility_id"], int)
    assert body["locale"] == "en"
    assert body["phone_e164"] == "+254722222222"

    ranked = client.get(
        "/facilities/recommend",
        params={"lat": -1.2925, "lng": 36.821},
    )
    assert ranked.status_code == 200
    knh = next(
        row
        for row in ranked.json()["facilities"]
        if row["kmhfr_code"] == "SEED-NBO-KNH"
    )
    assert body["facility_id"] == knh["id"]
