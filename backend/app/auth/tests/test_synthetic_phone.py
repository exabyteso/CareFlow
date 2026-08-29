"""Unit tests for deterministic Kenya-mobile synthetic patient phones."""

from __future__ import annotations

import re

from app.auth.seed import (
    DEMO_PATIENT_PHONE,
    DEMO_STAFF_PHONE,
    synthetic_patient_phone,
)

_KE_MOBILE_E164 = re.compile(r"^\+254[17][0-9]{8}$")
_RESERVED = frozenset({DEMO_PATIENT_PHONE, DEMO_STAFF_PHONE})
_UIDS = (
    "firebase-uid-a",
    "firebase-uid-b",
    "demo-patient",
    "demo-staff",
    "x",
    "user-123",
    "aaaaaaaa",
)


def test_synthetic_phone_fullmatch_kenya_e164():
    for uid in _UIDS:
        for attempt in (0, 1, 2, 7):
            phone = synthetic_patient_phone(uid, attempt)
            assert _KE_MOBILE_E164.fullmatch(phone), phone


def test_synthetic_phone_never_returns_reserved_demo_numbers():
    for uid in _UIDS:
        for attempt in range(8):
            phone = synthetic_patient_phone(uid, attempt)
            assert phone not in _RESERVED, (uid, attempt, phone)


def test_synthetic_phone_is_deterministic_for_uid_and_attempt():
    for uid in _UIDS:
        for attempt in (0, 1, 3):
            assert synthetic_patient_phone(uid, attempt) == synthetic_patient_phone(
                uid, attempt
            )
