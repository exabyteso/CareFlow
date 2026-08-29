"""JSON shapes for the hospital desk (snake_case, no /v1)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class FacilityWait(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    kmhfr_code: str
    wait_count: int = Field(
        description=(
            "Desk-typed ranking input (INV-16, X-08). "
            "Not a live HMIS feed; not queue position."
        ),
    )


class QueueBooking(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: Literal["booked", "arrived", "no_show", "cancelled"]
    booking_kind: Literal["instant", "appointment"]
    queue_position: int | None = Field(
        description=(
            "Derived position among open instant bookings at this facility. "
            "Not wait_count. Null when the booking is not in the open queue."
        ),
    )
    created_at: datetime
    given_name: str | None
    family_name: str | None
    phone_last4: str
    symptom_slugs: list[str]
    patient_free_text: str | None
    red_flag_applied: bool


class HospitalQueueResponse(BaseModel):
    facility: FacilityWait
    bookings: list[QueueBooking]


class WaitCountPatch(BaseModel):
    wait_count: int = Field(
        ge=0,
        description=(
            "Staff override of the ranking wait_count for this facility only. "
            "Not HMIS. Not queue position."
        ),
    )


class WaitCountResponse(BaseModel):
    facility_id: int
    wait_count: int


class BookingStatusResponse(BaseModel):
    booking: QueueBooking
    wait_count: int = Field(
        description="facilities.wait_count after this mutation (this facility only).",
    )
