"""POST /bookings — instant book + wait increment (J1 / J2).

Mount is a P1 handshake. Decrement is P4. Notify is P5.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, StringConstraints
from sqlalchemy.orm import Session

from app.auth.deps import CurrentUser, get_current_user
from app.bookings.create import (
    NOTIFY_LOCALES,
    FacilityBelowKeph,
    FacilityUnavailable,
    UnknownSymptoms,
    create_instant_booking,
)
from app.core.db import get_db
from app.core.errors import ErrorEnvelope

router = APIRouter(tags=["bookings"])

SymptomId = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=100,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    ),
]


class CreateBookingRequest(BaseModel):
    facility_id: int = Field(ge=1)
    symptom_ids: list[SymptomId] = Field(min_length=1, max_length=20)
    notify_locale: str | None = None
    patient_free_text: str | None = Field(default=None, max_length=2000)


class BookingFacilitySnapshot(BaseModel):
    kmhfr_code: str
    name: str
    keph_level: int
    lat: float
    lng: float
    county: str
    wait_count_at_book: int


class CreateBookingResponse(BaseModel):
    id: int
    status: str
    facility_id: int
    facility: BookingFacilitySnapshot
    keph_min_applied: int
    red_flag_applied: bool
    symptom_ids: list[str]


def _forbidden() -> HTTPException:
    return HTTPException(
        status_code=403,
        detail={
            "code": "forbidden",
            "message": "Only care-seekers can create bookings.",
        },
    )


@router.post(
    "/bookings",
    response_model=CreateBookingResponse,
    operation_id="createBooking",
    summary="Create an instant booking and increment wait_count",
    description=(
        "Locks the facility, inserts instant booking rows, freezes a facility "
        "snapshot, then increments wait_count. Does not decrement and does not send SMS."
    ),
    responses={
        401: {"model": ErrorEnvelope},
        403: {"model": ErrorEnvelope},
        404: {"model": ErrorEnvelope},
        409: {"model": ErrorEnvelope},
        422: {"model": ErrorEnvelope},
    },
)
def create_booking(
    body: CreateBookingRequest,
    user: CurrentUser = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> CreateBookingResponse:
    if user.role != "patient":
        raise _forbidden()
    locale = (body.notify_locale or user.ui_locale).strip()
    if locale not in NOTIFY_LOCALES:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "validation_error",
                "message": f"notify_locale must be one of {sorted(NOTIFY_LOCALES)}.",
            },
        )
    try:
        created = create_instant_booking(
            session,
            patient_user_id=user.id,
            facility_id=body.facility_id,
            symptom_slugs=body.symptom_ids,
            notify_locale=locale,
            patient_free_text=body.patient_free_text,
        )
    except FacilityUnavailable as exc:
        raise HTTPException(
            status_code=404,
            detail={"code": "facility_not_found", "message": str(exc)},
        ) from exc
    except FacilityBelowKeph as exc:
        raise HTTPException(
            status_code=409,
            detail={"code": "facility_below_keph_min", "message": str(exc)},
        ) from exc
    except UnknownSymptoms as exc:
        raise HTTPException(
            status_code=422,
            detail={"code": "unknown_symptom", "message": str(exc)},
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail={"code": "validation_error", "message": str(exc)},
        ) from exc

    snap = created.snapshot
    return CreateBookingResponse(
        id=created.id,
        status=created.status,
        facility_id=created.facility_id,
        facility=BookingFacilitySnapshot(
            kmhfr_code=snap.kmhfr_code,
            name=snap.name,
            keph_level=snap.keph_level,
            lat=snap.lat,
            lng=snap.lng,
            county=snap.county,
            wait_count_at_book=snap.wait_count_at_book,
        ),
        keph_min_applied=created.keph_min_applied,
        red_flag_applied=created.red_flag_applied,
        symptom_ids=list(created.symptom_ids),
    )
