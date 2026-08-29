"""Hospital desk routes — this facility only (J4, J5).

Wait decrement lives here. P2 increments on POST /bookings. P5 owns notes/SMS.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from app.auth.deps import CurrentUser
from app.core.db import get_db
from app.core.errors import ErrorEnvelope
from app.hospital.deps import require_hospital_staff
from app.hospital.schemas import (
    BookingStatusResponse,
    HospitalQueueResponse,
    WaitCountPatch,
    WaitCountResponse,
)
from app.hospital import service

router = APIRouter(prefix="/hospital", tags=["hospital"])

_UNAUTHORIZED_EXAMPLE = {
    "error": {
        "code": "unauthorized",
        "message": "Missing or invalid Firebase ID token.",
    }
}
_FORBIDDEN_EXAMPLE = {
    "error": {
        "code": "forbidden",
        "message": "Hospital desk is for hospital staff of this facility only.",
    }
}
_NOT_FOUND_EXAMPLE = {
    "error": {
        "code": "not_found",
        "message": "No booking at this facility matches that id.",
    }
}
_CONFLICT_EXAMPLE = {
    "error": {
        "code": "conflict",
        "message": "Booking is already no_show; it cannot be marked arrived.",
    }
}
_VALIDATION_EXAMPLE = {
    "error": {
        "code": "validation_error",
        "message": "Input should be greater than or equal to 0",
    }
}

_STAFF_ERRORS = {
    401: {
        "model": ErrorEnvelope,
        "description": "Missing or invalid Firebase ID token.",
        "content": {
            "application/json": {
                "schema": {"$ref": "#/components/schemas/ErrorEnvelope"},
                "example": _UNAUTHORIZED_EXAMPLE,
            }
        },
    },
    403: {
        "model": ErrorEnvelope,
        "description": "Signed-in user is not hospital staff of a facility.",
        "content": {
            "application/json": {
                "schema": {"$ref": "#/components/schemas/ErrorEnvelope"},
                "example": _FORBIDDEN_EXAMPLE,
            }
        },
    },
}


@router.get(
    "/queue",
    response_model=HospitalQueueResponse,
    operation_id="getHospitalQueue",
    summary="Today's desk queue for this facility",
    description=(
        "Return this staff member's facility wait_count and bookings. "
        "Open ``booked`` rows plus arrivals / no-shows dated today in "
        "Africa/Nairobi. Other facilities are never returned (RLS + staff "
        "facility_id). wait_count is a desk ranking input, not queue position."
    ),
    responses=_STAFF_ERRORS,
)
def get_queue(
    user: Annotated[CurrentUser, Depends(require_hospital_staff)],
    session: Annotated[Session, Depends(get_db)],
) -> HospitalQueueResponse:
    facility_id = user.facility_id
    assert facility_id is not None
    facility = service.load_facility(session, facility_id)
    bookings = service.load_queue(session, facility_id)
    return HospitalQueueResponse(facility=facility, bookings=bookings)


@router.patch(
    "/wait-count",
    response_model=WaitCountResponse,
    operation_id="patchHospitalWaitCount",
    summary="Staff override of people waiting (ranking input)",
    description=(
        "Set facilities.wait_count for this staff member's facility only. "
        "This is the J4 desk-typed ranking input, not HMIS and not queue "
        "position. Drift versus COUNT(*) of bookings is allowed; negative is not."
    ),
    responses={
        **_STAFF_ERRORS,
        422: {
            "model": ErrorEnvelope,
            "description": "wait_count is negative or missing.",
            "content": {
                "application/json": {
                    "schema": {"$ref": "#/components/schemas/ErrorEnvelope"},
                    "example": _VALIDATION_EXAMPLE,
                }
            },
        },
    },
)
def patch_wait_count(
    body: WaitCountPatch,
    user: Annotated[CurrentUser, Depends(require_hospital_staff)],
    session: Annotated[Session, Depends(get_db)],
) -> WaitCountResponse:
    facility_id = user.facility_id
    assert facility_id is not None
    wait_count = service.patch_wait_count(
        session, facility_id=facility_id, wait_count=body.wait_count
    )
    return WaitCountResponse(facility_id=facility_id, wait_count=wait_count)


@router.post(
    "/bookings/{booking_id}/arrived",
    response_model=BookingStatusResponse,
    operation_id="markBookingArrived",
    summary="Mark booking as met (arrived); decrement wait_count once",
    description=(
        "Transition a ``booked`` instant booking at this facility to "
        "``arrived`` and decrement wait_count in the same transaction "
        "(never negative). Repeat POST is idempotent. A booking at another "
        "facility is 404. Does not send SMS or write notes."
    ),
    responses={
        **_STAFF_ERRORS,
        404: {
            "model": ErrorEnvelope,
            "description": "Booking is not at this facility (or does not exist).",
            "content": {
                "application/json": {
                    "schema": {"$ref": "#/components/schemas/ErrorEnvelope"},
                    "example": _NOT_FOUND_EXAMPLE,
                }
            },
        },
        409: {
            "model": ErrorEnvelope,
            "description": "Booking is already in a different terminal status.",
            "content": {
                "application/json": {
                    "schema": {"$ref": "#/components/schemas/ErrorEnvelope"},
                    "example": _CONFLICT_EXAMPLE,
                }
            },
        },
    },
)
def mark_arrived(
    booking_id: Annotated[int, Path(ge=1)],
    user: Annotated[CurrentUser, Depends(require_hospital_staff)],
    session: Annotated[Session, Depends(get_db)],
) -> BookingStatusResponse:
    facility_id = user.facility_id
    assert facility_id is not None
    booking, wait_count = service.mark_terminal(
        session,
        booking_id=booking_id,
        facility_id=facility_id,
        status="arrived",
    )
    return BookingStatusResponse(booking=booking, wait_count=wait_count)


@router.post(
    "/bookings/{booking_id}/no-show",
    response_model=BookingStatusResponse,
    operation_id="markBookingNoShow",
    summary="Mark booking as did not come; decrement wait_count once",
    description=(
        "Transition a ``booked`` instant booking at this facility to "
        "``no_show`` and decrement wait_count in the same transaction "
        "(never negative). Repeat POST is idempotent. P5 sends the J3 SMS; "
        "this handler only changes booking status."
    ),
    responses={
        **_STAFF_ERRORS,
        404: {
            "model": ErrorEnvelope,
            "description": "Booking is not at this facility (or does not exist).",
            "content": {
                "application/json": {
                    "schema": {"$ref": "#/components/schemas/ErrorEnvelope"},
                    "example": _NOT_FOUND_EXAMPLE,
                }
            },
        },
        409: {
            "model": ErrorEnvelope,
            "description": "Booking is already in a different terminal status.",
            "content": {
                "application/json": {
                    "schema": {"$ref": "#/components/schemas/ErrorEnvelope"},
                    "example": _CONFLICT_EXAMPLE,
                }
            },
        },
    },
)
def mark_no_show(
    booking_id: Annotated[int, Path(ge=1)],
    user: Annotated[CurrentUser, Depends(require_hospital_staff)],
    session: Annotated[Session, Depends(get_db)],
) -> BookingStatusResponse:
    facility_id = user.facility_id
    assert facility_id is not None
    booking, wait_count = service.mark_terminal(
        session,
        booking_id=booking_id,
        facility_id=facility_id,
        status="no_show",
    )
    return BookingStatusResponse(booking=booking, wait_count=wait_count)
