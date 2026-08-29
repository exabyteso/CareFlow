"""Idempotent synthetic demo users (no public signup).

Unknown Firebase UIDs are auto-provisioned as patients on first ``GET /me``
(see ``deps.get_current_user``). Hospital staff remain invite-only
(``demo-staff`` seed only). ``ensure_demo_users`` still must not insert
arbitrary UIDs.
"""

from __future__ import annotations

import hashlib
import re

from sqlalchemy import text
from sqlalchemy.orm import Session

DEMO_PATIENT_UID = "demo-patient"
DEMO_STAFF_UID = "demo-staff"
DEMO_PATIENT_PHONE = "+254711111111"
DEMO_STAFF_PHONE = "+254722222222"
DEMO_STAFF_KMHFR = "SEED-NBO-KNH"
# Labeled local-demo login only (ONBOARDING). Never stored in Postgres.
DEMO_PATIENT_EMAIL = "patient@careflow.local"
DEMO_STAFF_EMAIL = "staff@careflow.local"
DEMO_PASSWORD = "CareflowDemo1!"
# PWA demo login skips Firebase; API accepts these Bearer values as the demo UIDs.
DEMO_PATIENT_TOKEN = "careflow-demo-patient"
DEMO_STAFF_TOKEN = "careflow-demo-staff"
DEMO_BEARER_TOKENS = {
    DEMO_PATIENT_TOKEN: DEMO_PATIENT_UID,
    DEMO_STAFF_TOKEN: DEMO_STAFF_UID,
}

KE_MOBILE_E164_RE = re.compile(r"^\+254[17][0-9]{8}$")
_RESERVED_DEMO_PHONES = frozenset({DEMO_PATIENT_PHONE, DEMO_STAFF_PHONE})


def synthetic_patient_phone(uid: str, attempt: int = 0) -> str:
    """Deterministic unique Kenya mobile derived from UID (+ attempt for retries).

    Prefers ``+2547`` + 8 digits. Never returns the reserved demo phones.
    """
    n = 0
    while True:
        digest = hashlib.sha256(f"{uid}\0{attempt}\0{n}".encode("utf-8")).digest()
        eight = int.from_bytes(digest[:8], "big") % 100_000_000
        phone = f"+2547{eight:08d}"
        if phone not in _RESERVED_DEMO_PHONES and KE_MOBILE_E164_RE.fullmatch(phone):
            return phone
        n += 1


def ensure_demo_users(session: Session) -> None:
    """Insert demo care-seeker + hospital-staff rows if missing.

    Staff ``facility_id`` comes from ``facilities.kmhfr_code = SEED-NBO-KNH``
    (S-38: hospital staff without a facility is not a valid session).
    Unknown Firebase UIDs are never inserted here.
    """
    from app.facilities.seed import ensure_nairobi_seed

    ensure_nairobi_seed(session)

    session.execute(
        text(
            """
            INSERT INTO users (firebase_uid, role, phone_e164, ui_locale, facility_id)
            VALUES (
                :uid,
                CAST(:role AS user_role),
                :phone,
                CAST(:locale AS ui_locale),
                NULL
            )
            ON CONFLICT (firebase_uid) DO NOTHING
            """
        ),
        {
            "uid": DEMO_PATIENT_UID,
            "role": "patient",
            "phone": DEMO_PATIENT_PHONE,
            "locale": "en",
        },
    )
    session.execute(
        text(
            """
            INSERT INTO users (firebase_uid, role, phone_e164, ui_locale, facility_id)
            SELECT
                :uid,
                CAST(:role AS user_role),
                :phone,
                CAST(:locale AS ui_locale),
                f.id
            FROM facilities f
            WHERE f.kmhfr_code = :kmhfr
            ON CONFLICT (firebase_uid) DO NOTHING
            """
        ),
        {
            "uid": DEMO_STAFF_UID,
            "role": "hospital_staff",
            "phone": DEMO_STAFF_PHONE,
            "locale": "en",
            "kmhfr": DEMO_STAFF_KMHFR,
        },
    )
