"""Create an instant booking and increment facility wait_count (P2).

P4 owns decrement. Do not send SMS here (P5).
"""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import bindparam, text
from sqlalchemy.orm import Session

from app.symptoms.seed import ensure_symptom_catalog
from app.triage.rules import rules_from_symptoms

_LOCK_FACILITY = text(
    """
    SELECT id, kmhfr_code, name, keph_level, lat, lng, county, wait_count
    FROM facilities
    WHERE id = :facility_id AND operational
    FOR UPDATE
    """
)

_SYMPTOMS_BY_SLUG = text(
    """
    SELECT id, slug, keph_min, red_flag
    FROM symptoms
    WHERE active AND slug IN :slugs
    """
).bindparams(bindparam("slugs", expanding=True))

_INSERT_BOOKING = text(
    """
    INSERT INTO bookings (
      facility_id, patient_user_id, department_id,
      booking_kind, booking_channel, status, notify_locale,
      keph_min_applied, red_flag_applied, patient_free_text
    ) VALUES (
      :facility_id,
      :patient_user_id,
      NULL,
      CAST('instant' AS booking_kind),
      CAST('ranked_recommend' AS booking_channel),
      CAST('booked' AS booking_status),
      CAST(:notify_locale AS notify_locale),
      :keph_min_applied,
      :red_flag_applied,
      :patient_free_text
    )
    RETURNING id
    """
)

_INSERT_INSTANT = text(
    "INSERT INTO booking_instant (booking_id) VALUES (:booking_id)"
)

_INSERT_SYMPTOM = text(
    """
    INSERT INTO booking_symptoms (booking_id, symptom_id, map_score, sort_order)
    VALUES (:booking_id, :symptom_id, :map_score, :sort_order)
    """
)

_INSERT_SNAPSHOT = text(
    """
    INSERT INTO booking_facility_snapshots (
      booking_id, kmhfr_code, name, keph_level, lat, lng, county, wait_count_at_book
    ) VALUES (
      :booking_id, :kmhfr_code, :name, :keph_level, :lat, :lng, :county, :wait_count_at_book
    )
    """
)

_BUMP_WAIT = text(
    """
    UPDATE facilities
    SET wait_count = wait_count + 1
    WHERE id = :facility_id
    """
)

NOTIFY_LOCALES = frozenset({"en", "sw", "ki", "luo", "kln", "kam", "mer"})


class FacilityUnavailable(LookupError):
    """Facility missing or not operational."""


class FacilityBelowKeph(ValueError):
    """Selected facility is below the symptom-derived KEPH floor."""


class UnknownSymptoms(ValueError):
    """One or more catalog slugs do not exist."""


@dataclass(frozen=True, slots=True)
class BookingSymptom:
    id: int
    slug: str
    keph_min: int
    red_flag: bool


@dataclass(frozen=True, slots=True)
class BookingSnapshot:
    kmhfr_code: str
    name: str
    keph_level: int
    lat: float
    lng: float
    county: str
    wait_count_at_book: int


@dataclass(frozen=True, slots=True)
class CreatedBooking:
    id: int
    status: str
    facility_id: int
    snapshot: BookingSnapshot
    keph_min_applied: int
    red_flag_applied: bool
    symptom_ids: tuple[str, ...]


def create_instant_booking(
    session: Session,
    *,
    patient_user_id: int,
    facility_id: int,
    symptom_slugs: list[str],
    notify_locale: str,
    patient_free_text: str | None,
    map_scores: dict[str, float] | None = None,
) -> CreatedBooking:
    slugs = list(dict.fromkeys(item.strip() for item in symptom_slugs if item.strip()))
    if not slugs:
        raise UnknownSymptoms("at least one symptom_id is required")
    if notify_locale not in NOTIFY_LOCALES:
        raise ValueError(f"unsupported notify_locale: {notify_locale}")

    ensure_symptom_catalog(session)

    facility = session.execute(_LOCK_FACILITY, {"facility_id": facility_id}).mappings().first()
    if facility is None:
        raise FacilityUnavailable(f"facility {facility_id} is not bookable")

    found = (
        BookingSymptom(
            id=int(row["id"]),
            slug=str(row["slug"]),
            keph_min=int(row["keph_min"]),
            red_flag=bool(row["red_flag"]),
        )
        for row in session.execute(_SYMPTOMS_BY_SLUG, {"slugs": slugs}).mappings()
    )
    by_slug = {row.slug: row for row in found}
    missing = [slug for slug in slugs if slug not in by_slug]
    if missing:
        raise UnknownSymptoms(f"unknown symptom_id: {', '.join(missing)}")

    selected = tuple(by_slug[slug] for slug in slugs)
    keph_min, red_flag = rules_from_symptoms(selected)
    facility_keph = int(facility["keph_level"])
    if facility_keph < keph_min:
        raise FacilityBelowKeph(
            f"facility {facility_id} is KEPH {facility_keph}; "
            f"symptoms require KEPH {keph_min} or above"
        )

    wait_at_book = int(facility["wait_count"])
    booking_id = int(
        session.execute(
            _INSERT_BOOKING,
            {
                "facility_id": facility_id,
                "patient_user_id": patient_user_id,
                "notify_locale": notify_locale,
                "keph_min_applied": keph_min,
                "red_flag_applied": red_flag,
                "patient_free_text": patient_free_text,
            },
        ).scalar_one()
    )
    session.execute(_INSERT_INSTANT, {"booking_id": booking_id})
    for order, slug in enumerate(slugs):
        row = by_slug[slug]
        score = None if map_scores is None else map_scores.get(slug)
        session.execute(
            _INSERT_SYMPTOM,
            {
                "booking_id": booking_id,
                "symptom_id": row.id,
                "map_score": score,
                "sort_order": order,
            },
        )
    session.execute(
        _INSERT_SNAPSHOT,
        {
            "booking_id": booking_id,
            "kmhfr_code": facility["kmhfr_code"],
            "name": facility["name"],
            "keph_level": int(facility["keph_level"]),
            "lat": float(facility["lat"]),
            "lng": float(facility["lng"]),
            "county": facility["county"],
            "wait_count_at_book": wait_at_book,
        },
    )
    session.execute(_BUMP_WAIT, {"facility_id": facility_id})

    return CreatedBooking(
        id=booking_id,
        status="booked",
        facility_id=facility_id,
        snapshot=BookingSnapshot(
            kmhfr_code=str(facility["kmhfr_code"]),
            name=str(facility["name"]),
            keph_level=int(facility["keph_level"]),
            lat=float(facility["lat"]),
            lng=float(facility["lng"]),
            county=str(facility["county"]),
            wait_count_at_book=wait_at_book,
        ),
        keph_min_applied=keph_min,
        red_flag_applied=red_flag,
        symptom_ids=tuple(slugs),
    )
