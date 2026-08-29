"""Persist notes and note_images (J6)."""

from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.notes.schemas import CreateNoteRequest, NoteImageResponse, NoteResponse


def _booking_in_staff_facility(session: Session, booking_id: int, facility_id: int) -> bool:
    row = session.execute(
        text(
            """
            SELECT 1 FROM bookings
            WHERE id = :booking_id AND facility_id = :facility_id
            """
        ),
        {"booking_id": booking_id, "facility_id": facility_id},
    ).first()
    return row is not None


def _payload_has_content(payload: CreateNoteRequest) -> bool:
    if payload.body_text and payload.body_text.strip():
        return True
    if payload.audio_transcript and payload.audio_transcript.strip():
        return True
    if payload.ocr_text and payload.ocr_text.strip():
        return True
    return bool(payload.images)


def create_note(
    session: Session,
    *,
    booking_id: int,
    author_user_id: int,
    staff_facility_id: int,
    payload: CreateNoteRequest,
) -> NoteResponse:
    if not _booking_in_staff_facility(session, booking_id, staff_facility_id):
        raise LookupError("booking_not_found")

    if not _payload_has_content(payload):
        raise ValueError("empty_note")

    note_row = session.execute(
        text(
            """
            INSERT INTO notes (booking_id, author_user_id, body_text, audio_transcript, ocr_text)
            VALUES (:booking_id, :author_id, :body_text, :audio_transcript, :ocr_text)
            RETURNING id, booking_id, author_user_id, body_text, audio_transcript, ocr_text, created_at
            """
        ),
        {
            "booking_id": booking_id,
            "author_id": author_user_id,
            "body_text": payload.body_text,
            "audio_transcript": payload.audio_transcript,
            "ocr_text": payload.ocr_text,
        },
    ).mappings().one()

    images: list[NoteImageResponse] = []
    for image in payload.images:
        img_row = session.execute(
            text(
                """
                INSERT INTO note_images (note_id, image_url, ocr_text, sort_order)
                VALUES (:note_id, :image_url, :ocr_text, :sort_order)
                RETURNING id, image_url, ocr_text, sort_order
                """
            ),
            {
                "note_id": note_row["id"],
                "image_url": image.image_url,
                "ocr_text": image.ocr_text,
                "sort_order": image.sort_order,
            },
        ).mappings().one()
        images.append(NoteImageResponse.model_validate(dict(img_row)))

    return NoteResponse(
        id=int(note_row["id"]),
        booking_id=int(note_row["booking_id"]),
        author_user_id=int(note_row["author_user_id"]),
        body_text=note_row["body_text"],
        audio_transcript=note_row["audio_transcript"],
        ocr_text=note_row["ocr_text"],
        created_at=note_row["created_at"],
        images=images,
    )


def list_notes_for_booking(
    session: Session,
    *,
    booking_id: int,
    staff_facility_id: int,
) -> list[NoteResponse]:
    if not _booking_in_staff_facility(session, booking_id, staff_facility_id):
        raise LookupError("booking_not_found")

    note_rows = session.execute(
        text(
            """
            SELECT id, booking_id, author_user_id, body_text, audio_transcript, ocr_text, created_at
            FROM notes
            WHERE booking_id = :booking_id
            ORDER BY created_at ASC, id ASC
            """
        ),
        {"booking_id": booking_id},
    ).mappings().all()

    results: list[NoteResponse] = []
    for note_row in note_rows:
        image_rows = session.execute(
            text(
                """
                SELECT id, image_url, ocr_text, sort_order
                FROM note_images
                WHERE note_id = :note_id
                ORDER BY sort_order ASC, id ASC
                """
            ),
            {"note_id": note_row["id"]},
        ).mappings().all()
        images = [NoteImageResponse.model_validate(dict(r)) for r in image_rows]
        results.append(
            NoteResponse(
                id=int(note_row["id"]),
                booking_id=int(note_row["booking_id"]),
                author_user_id=int(note_row["author_user_id"]),
                body_text=note_row["body_text"],
                audio_transcript=note_row["audio_transcript"],
                ocr_text=note_row["ocr_text"],
                created_at=note_row["created_at"],
                images=images,
            )
        )
    return results
