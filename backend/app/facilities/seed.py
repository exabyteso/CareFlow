"""Load committed Nairobi seed rows when `facilities` is empty (J7 / FR-PL-04).

wait_count on these rows is a desk-typed demo ranking input (INV-16, X-08).
It is not a live HMIS feed and is not queue position.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

# Kenya bbox matches facilities_kenya_bbox_chk (NFR-GEO-01).
KENYA_LAT_MIN = -5.0
KENYA_LAT_MAX = 5.6
KENYA_LNG_MIN = 33.5
KENYA_LNG_MAX = 42.2

# app/facilities/seed.py → parents[2] is backend/ locally and /app in Docker.
_SEED_PATH = Path(__file__).resolve().parents[2] / "data" / "nairobi-facilities.json"

_INSERT = text(
    """
    INSERT INTO facilities (
      kmhfr_code, name, keph_level, lat, lng, county,
      operational, wait_count, source, synced_at
    ) VALUES (
      :kmhfr_code, :name, :keph_level, :lat, :lng, :county,
      :operational, :wait_count, CAST(:source AS facility_source), now()
    )
    """
)


def in_kenya_bbox(lat: float, lng: float) -> bool:
    return (
        KENYA_LAT_MIN <= lat <= KENYA_LAT_MAX
        and KENYA_LNG_MIN <= lng <= KENYA_LNG_MAX
    )


def _as_float(value: object) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    return None


def _row_from_json(raw: dict[str, Any]) -> dict[str, Any] | None:
    lat = _as_float(raw.get("lat"))
    lng = _as_float(raw.get("lng"))
    if lat is None or lng is None:
        return None
    if not in_kenya_bbox(lat, lng):
        return None
    keph = raw.get("keph_level")
    if not isinstance(keph, int) or not (2 <= keph <= 6):
        return None
    wait = raw.get("wait_count", 0)
    if not isinstance(wait, int) or wait < 0:
        return None
    code = raw.get("kmhfr_code")
    name = raw.get("name")
    county = raw.get("county")
    if not isinstance(code, str) or not code.strip():
        return None
    if not isinstance(name, str) or not name.strip():
        return None
    if not isinstance(county, str) or not county.strip():
        return None
    source = raw.get("source", "seed")
    if source != "seed":
        return None
    operational = raw.get("operational", True)
    if not isinstance(operational, bool):
        return None
    return {
        "kmhfr_code": code.strip(),
        "name": name.strip(),
        "keph_level": keph,
        "lat": lat,
        "lng": lng,
        "county": county.strip(),
        "operational": operational,
        "wait_count": wait,
        "source": "seed",
    }


def _load_seed_rows() -> list[dict[str, Any]]:
    payload = json.loads(_SEED_PATH.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        return []
    rows: list[dict[str, Any]] = []
    for item in payload:
        if not isinstance(item, dict):
            continue
        row = _row_from_json(item)
        if row is not None:
            rows.append(row)
    return rows


def ensure_nairobi_seed(session: Session) -> None:
    """INSERT seed facilities when the table is empty. No-op if any row exists."""
    count = session.execute(text("SELECT COUNT(*) FROM facilities")).scalar_one()
    if count > 0:
        return
    rows = _load_seed_rows()
    if not rows:
        return
    session.execute(_INSERT, rows)
