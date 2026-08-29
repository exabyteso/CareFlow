"""Demo Bearer tokens skip Firebase Admin verification."""

from __future__ import annotations

import pytest

from app.auth.firebase import FirebaseAuthError, verify_id_token
from app.auth.seed import (
    DEMO_PATIENT_TOKEN,
    DEMO_PATIENT_UID,
    DEMO_STAFF_TOKEN,
    DEMO_STAFF_UID,
)


def test_verify_id_token_demo_patient_skips_firebase():
    decoded = verify_id_token(DEMO_PATIENT_TOKEN)
    assert decoded["uid"] == DEMO_PATIENT_UID
    assert decoded["sub"] == DEMO_PATIENT_UID


def test_verify_id_token_demo_staff_skips_firebase():
    decoded = verify_id_token(f"  {DEMO_STAFF_TOKEN}  ")
    assert decoded["uid"] == DEMO_STAFF_UID
    assert decoded["sub"] == DEMO_STAFF_UID


def test_verify_id_token_empty_raises():
    with pytest.raises(FirebaseAuthError):
        verify_id_token("")
    with pytest.raises(FirebaseAuthError):
        verify_id_token("   ")
