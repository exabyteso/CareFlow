"""POST/GET /hospital/bookings/{id}/notes — staff of booking facility only (J6)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.deps import CurrentUser
from app.core.db import get_db
from app.core.errors import ErrorEnvelope
from app.notes.deps import require_hospital_staff
from app.notes.schemas import CreateNoteRequest, NoteListResponse, NoteResponse
from app.notes.service import create_note, list_notes_for_booking

router = APIRouter(prefix="/hospital/bookings", tags=["notes"])


@router.post(
    "/{booking_id}/notes",
    response_model=NoteResponse,
    operation_id="createBookingNote",
    summary="Add a clinical note to a booking (staff, same facility)",
    responses={
        403: {"model": ErrorEnvelope, "description": "Not hospital staff or wrong facility."},
        404: {"model": ErrorEnvelope, "description": "Booking not found at this facility."},
        422: {"model": ErrorEnvelope, "description": "Empty note payload."},
    },
)
def post_booking_note(
    booking_id: int,
    body: CreateNoteRequest,
    staff: Annotated[CurrentUser, Depends(require_hospital_staff)],
    session: Annotated[Session, Depends(get_db)],
) -> NoteResponse:
    try:
        return create_note(
            session,
            booking_id=booking_id,
            author_user_id=staff.id,
            staff_facility_id=staff.facility_id,  # type: ignore[arg-type]
            payload=body,
        )
    except LookupError:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "booking_not_found",
                "message": "Booking not found for this facility.",
            },
        ) from None
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "validation_error",
                "message": "At least one of body_text, audio_transcript, ocr_text, or images is required.",
            },
        ) from None


@router.get(
    "/{booking_id}/notes",
    response_model=NoteListResponse,
    operation_id="listBookingNotes",
    summary="List notes for a booking (staff, same facility)",
    responses={
        403: {"model": ErrorEnvelope, "description": "Not hospital staff."},
        404: {"model": ErrorEnvelope, "description": "Booking not found at this facility."},
    },
)
def get_booking_notes(
    booking_id: int,
    staff: Annotated[CurrentUser, Depends(require_hospital_staff)],
    session: Annotated[Session, Depends(get_db)],
) -> NoteListResponse:
    try:
        notes = list_notes_for_booking(
            session,
            booking_id=booking_id,
            staff_facility_id=staff.facility_id,  # type: ignore[arg-type]
        )
    except LookupError:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "booking_not_found",
                "message": "Booking not found for this facility.",
            },
        ) from None
    return NoteListResponse(notes=notes)
