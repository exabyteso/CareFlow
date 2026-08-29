"""Postgres RLS session GUCs for care-seeker vs hospital-staff isolation.

Wave 2 auth will call this after verifying a Firebase token. Unused in Wave 1.
Policies read current_setting('app.user_id' | 'app.role' | 'app.facility_id', true).
"""

from sqlalchemy import text
from sqlalchemy.orm import Session


def _guc_value(value: int | str | None) -> str:
    if value is None:
        return ""
    return str(value)


def set_rls_gucs(
    session: Session,
    *,
    user_id: int | None,
    role: str | None,
    facility_id: int | None,
) -> None:
    """SET LOCAL app.user_id / app.role / app.facility_id for this transaction.

    Empty/None becomes '' so current_setting(..., true) does not error.
    Uses set_config(..., is_local=true), which is SET LOCAL (not SET SESSION)
    and accepts bind parameters (raw SET LOCAL does not).
    """
    pairs = (
        ("app.user_id", _guc_value(user_id)),
        ("app.role", _guc_value(role)),
        ("app.facility_id", _guc_value(facility_id)),
    )
    for name, value in pairs:
        session.execute(
            text("SELECT set_config(:name, :value, true)"),
            {"name": name, "value": value},
        )
