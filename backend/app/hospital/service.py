"""Hospital desk persistence: this-facility queue, wait PATCH, terminal decrement.

Lock order matches plans/product-schema.md §4: facilities FOR UPDATE, then booking.
P2 owns wait increment on POST /bookings — this module never increments.
"""

from __future__ import annotations

from typing import Literal

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.hospital.schemas import FacilityWait, QueueBooking

TerminalStatus = Literal["arrived", "no_show"]

_FACILITY_SQL = text(
    """
    SELECT id, name, kmhfr_code, wait_count
    FROM facilities
    WHERE id = :facility_id
    """
)

_FACILITY_FOR_UPDATE_SQL = text(
    """
    SELECT id, wait_count
    FROM facilities
    WHERE id = :facility_id
    FOR UPDATE
    """
)

_PATCH_WAIT_SQL = text(
    """
    UPDATE facilities
       SET wait_count = :wait_count
     WHERE id = :facility_id
    RETURNING id, wait_count
    """
)

_QUEUE_SQL = text(
    """
    SELECT
      b.id,
      b.status::text AS status,
      b.booking_kind::text AS booking_kind,
      b.created_at,
      b.patient_free_text,
      b.red_flag_applied,
      d.given_name,
      d.family_name,
      d.phone_last4,
      q.queue_position,
      COALESCE(
        array_agg(s.slug ORDER BY bs.sort_order, s.slug)
          FILTER (WHERE s.slug IS NOT NULL),
        ARRAY[]::text[]
      ) AS symptom_slugs
    FROM bookings b
    LEFT JOIN v_queue_patient_display d ON d.user_id = b.patient_user_id
    LEFT JOIN v_instant_queue_positions q ON q.booking_id = b.id
    LEFT JOIN booking_symptoms bs ON bs.booking_id = b.id
    LEFT JOIN symptoms s ON s.id = bs.symptom_id
    WHERE b.facility_id = :facility_id
      AND (
        b.status = 'booked'
        OR (
          b.arrived_at IS NOT NULL
          AND (b.arrived_at AT TIME ZONE 'Africa/Nairobi')::date
            = (now() AT TIME ZONE 'Africa/Nairobi')::date
        )
        OR (
          b.no_show_at IS NOT NULL
          AND (b.no_show_at AT TIME ZONE 'Africa/Nairobi')::date
            = (now() AT TIME ZONE 'Africa/Nairobi')::date
        )
      )
    GROUP BY
      b.id,
      b.status,
      b.booking_kind,
      b.created_at,
      b.patient_free_text,
      b.red_flag_applied,
      d.given_name,
      d.family_name,
      d.phone_last4,
      q.queue_position
    ORDER BY
      CASE WHEN b.status = 'booked' THEN 0 ELSE 1 END,
      b.created_at ASC,
      b.id ASC
    """
)

_ONE_BOOKING_SQL = text(
    """
    SELECT
      b.id,
      b.status::text AS status,
      b.booking_kind::text AS booking_kind,
      b.created_at,
      b.patient_free_text,
      b.red_flag_applied,
      d.given_name,
      d.family_name,
      d.phone_last4,
      q.queue_position,
      COALESCE(
        array_agg(s.slug ORDER BY bs.sort_order, s.slug)
          FILTER (WHERE s.slug IS NOT NULL),
        ARRAY[]::text[]
      ) AS symptom_slugs
    FROM bookings b
    LEFT JOIN v_queue_patient_display d ON d.user_id = b.patient_user_id
    LEFT JOIN v_instant_queue_positions q ON q.booking_id = b.id
    LEFT JOIN booking_symptoms bs ON bs.booking_id = b.id
    LEFT JOIN symptoms s ON s.id = bs.symptom_id
    WHERE b.id = :booking_id
      AND b.facility_id = :facility_id
    GROUP BY
      b.id,
      b.status,
      b.booking_kind,
      b.created_at,
      b.patient_free_text,
      b.red_flag_applied,
      d.given_name,
      d.family_name,
      d.phone_last4,
      q.queue_position
    """
)

_LOCK_FACILITY_VIA_BOOKING_SQL = text(
    """
    SELECT f.id
      FROM facilities f
      JOIN bookings b ON b.facility_id = f.id
     WHERE b.id = :booking_id
       AND f.id = :facility_id
     FOR UPDATE OF f
    """
)

_BOOKING_FOR_UPDATE_SQL = text(
    """
    SELECT id, facility_id, booking_kind::text AS booking_kind, status::text AS status
      FROM bookings
     WHERE id = :booking_id
       AND facility_id = :facility_id
     FOR UPDATE
    """
)

_ARRIVED_DECREMENT_SQL = text(
    """
    WITH moved AS (
      UPDATE bookings
         SET status = CAST('arrived' AS booking_status),
             arrived_at = now(),
             updated_at = now()
       WHERE id = :booking_id
         AND facility_id = :facility_id
         AND status = 'booked'
         AND booking_kind = 'instant'
      RETURNING facility_id
    )
    UPDATE facilities f
       SET wait_count = wait_count - 1
      FROM moved
     WHERE f.id = moved.facility_id
       AND f.wait_count > 0
    """
)

_NO_SHOW_DECREMENT_SQL = text(
    """
    WITH moved AS (
      UPDATE bookings
         SET status = CAST('no_show' AS booking_status),
             no_show_at = now(),
             updated_at = now()
       WHERE id = :booking_id
         AND facility_id = :facility_id
         AND status = 'booked'
         AND booking_kind = 'instant'
      RETURNING facility_id
    )
    UPDATE facilities f
       SET wait_count = wait_count - 1
      FROM moved
     WHERE f.id = moved.facility_id
       AND f.wait_count > 0
    """
)

_ARRIVED_APPOINTMENT_SQL = text(
    """
    UPDATE bookings
       SET status = CAST('arrived' AS booking_status),
           arrived_at = now(),
           updated_at = now()
     WHERE id = :booking_id
       AND facility_id = :facility_id
       AND status = 'booked'
       AND booking_kind = 'appointment'
    """
)

_NO_SHOW_APPOINTMENT_SQL = text(
    """
    UPDATE bookings
       SET status = CAST('no_show' AS booking_status),
           no_show_at = now(),
           updated_at = now()
     WHERE id = :booking_id
       AND facility_id = :facility_id
       AND status = 'booked'
       AND booking_kind = 'appointment'
    """
)


def _not_found() -> HTTPException:
    return HTTPException(
        status_code=404,
        detail={
            "code": "not_found",
            "message": "No booking at this facility matches that id.",
        },
    )


def _conflict(message: str) -> HTTPException:
    return HTTPException(
        status_code=409,
        detail={"code": "conflict", "message": message},
    )


def _facility_missing() -> HTTPException:
    return HTTPException(
        status_code=404,
        detail={
            "code": "not_found",
            "message": "No facility is bound to this staff session.",
        },
    )


def _row_to_queue_booking(row: object) -> QueueBooking:
    mapping = row._mapping if hasattr(row, "_mapping") else row
    slugs = mapping["symptom_slugs"]
    if slugs is None:
        slug_list: list[str] = []
    else:
        slug_list = [str(item) for item in slugs]
    phone = mapping["phone_last4"]
    position = mapping["queue_position"]
    return QueueBooking(
        id=int(mapping["id"]),
        status=str(mapping["status"]),
        booking_kind=str(mapping["booking_kind"]),
        queue_position=int(position) if position is not None else None,
        created_at=mapping["created_at"],
        given_name=mapping["given_name"],
        family_name=mapping["family_name"],
        phone_last4=str(phone) if phone is not None else "",
        symptom_slugs=slug_list,
        patient_free_text=mapping["patient_free_text"],
        red_flag_applied=bool(mapping["red_flag_applied"]),
    )


def load_facility(session: Session, facility_id: int) -> FacilityWait:
    row = session.execute(_FACILITY_SQL, {"facility_id": facility_id}).first()
    if row is None:
        raise _facility_missing()
    return FacilityWait(
        id=int(row.id),
        name=row.name,
        kmhfr_code=row.kmhfr_code,
        wait_count=int(row.wait_count),
    )


def load_queue(session: Session, facility_id: int) -> list[QueueBooking]:
    rows = session.execute(_QUEUE_SQL, {"facility_id": facility_id})
    return [_row_to_queue_booking(row) for row in rows]


def load_queue_booking(
    session: Session, *, booking_id: int, facility_id: int
) -> QueueBooking:
    row = session.execute(
        _ONE_BOOKING_SQL,
        {"booking_id": booking_id, "facility_id": facility_id},
    ).first()
    if row is None:
        raise _not_found()
    return _row_to_queue_booking(row)


def patch_wait_count(session: Session, *, facility_id: int, wait_count: int) -> int:
    locked = session.execute(
        _FACILITY_FOR_UPDATE_SQL, {"facility_id": facility_id}
    ).first()
    if locked is None:
        raise _facility_missing()
    row = session.execute(
        _PATCH_WAIT_SQL,
        {"facility_id": facility_id, "wait_count": wait_count},
    ).first()
    if row is None:
        raise _facility_missing()
    return int(row.wait_count)


def mark_terminal(
    session: Session,
    *,
    booking_id: int,
    facility_id: int,
    status: TerminalStatus,
) -> tuple[QueueBooking, int]:
    """Transition booked → arrived | no_show. Decrement wait_count once for instant."""
    locked = session.execute(
        _LOCK_FACILITY_VIA_BOOKING_SQL,
        {"booking_id": booking_id, "facility_id": facility_id},
    ).first()
    if locked is None:
        raise _not_found()

    booking = session.execute(
        _BOOKING_FOR_UPDATE_SQL,
        {"booking_id": booking_id, "facility_id": facility_id},
    ).mappings().first()
    if booking is None:
        raise _not_found()

    current = str(booking["status"])
    if current == status:
        facility = load_facility(session, facility_id)
        return load_queue_booking(
            session, booking_id=booking_id, facility_id=facility_id
        ), facility.wait_count
    if current != "booked":
        raise _conflict(
            f"Booking is already {current}; it cannot be marked {status}."
        )

    kind = str(booking["booking_kind"])
    params = {"booking_id": booking_id, "facility_id": facility_id}
    if kind == "instant":
        sql = _ARRIVED_DECREMENT_SQL if status == "arrived" else _NO_SHOW_DECREMENT_SQL
        session.execute(sql, params)
    else:
        sql = _ARRIVED_APPOINTMENT_SQL if status == "arrived" else _NO_SHOW_APPOINTMENT_SQL
        session.execute(sql, params)

    facility = load_facility(session, facility_id)
    return load_queue_booking(
        session, booking_id=booking_id, facility_id=facility_id
    ), facility.wait_count
