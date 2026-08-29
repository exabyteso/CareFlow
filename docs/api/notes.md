# Notes (hospital bookings)

Clinical notes for hospital staff (J6). Patients **cannot** read notes (RLS + no patient API policy).

## Domain context

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/hospital/bookings/{booking_id}/notes` | Hospital staff, same facility as booking |
| `GET` | `/hospital/bookings/{booking_id}/notes` | Hospital staff, same facility |

**Storage:** `notes` + `note_images` (URLs only; no image bytes in Postgres).

## Shared types

### `CreateNoteRequest`

| JSON key | Type | Notes |
|----------|------|-------|
| `body_text` | string \| null | Free text |
| `audio_transcript` | string \| null | Browser speech → text |
| `ocr_text` | string \| null | Optional note-level OCR |
| `images` | array | `{ image_url, ocr_text?, sort_order? }` |

At least one field required.

## `POST /hospital/bookings/{booking_id}/notes`

- **Success** — `200` note with nested `images`.
- **Errors** — `403` (not staff), `404` (booking not at staff facility), `422` (empty payload).

## `GET /hospital/bookings/{booking_id}/notes`

- **Success** — `200` `{ "notes": [ … ] }` ordered by `created_at`.

## Frontend notes

- Route: `/hospital/notes?bookingId=` (P4 adds desk link).
- Client: `frontend/lib/api/notes.ts`.

## Implementation status snapshot (backend)

| Area | Status |
|------|--------|
| `backend/app/notes/` | **Implemented** |
| Hub `include_router(notes_router)` | **Handshake P1** |

## Reference files

- `backend/app/notes/router.py`
- `backend/app/notes/service.py`
- `frontend/app/hospital/notes/page.tsx`
