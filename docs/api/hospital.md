# Hospital desk

Staff at **one facility**: see people waiting, override the ranking wait, mark bookings met or did not come.

## Domain context

The hospital desk is journeys **J4** (wait count) and **J5** (mark met / did not come). Status `no_show` is the J3 trigger; this chapter does **not** send SMS — P5 notify owns that. Notes capture is [notes.md](notes.md) (P5).

**Base path:** `/hospital` (no `/v1`).

**Authentication:** Firebase ID token via `get_current_user`, then `require_hospital_staff` in `backend/app/hospital/deps.py`. Care-seekers (`role=patient`) receive **403** `forbidden`. Staff sessions are bound to `users.facility_id`; handlers never accept a facility id from the client.

Runtime still reads `Authorization` via `get_bearer_token` (not FastAPI `HTTPBearer` as a route dependency). OpenAPI should advertise HTTP Bearer on these operations after the P1 hub wires the router (same pattern as `GET /me`).

| Method | Path | Auth | OpenAPI tag | Journey |
|--------|------|------|-------------|---------|
| `GET` | `/hospital/queue` | Staff Bearer | `hospital` | J4, J5 |
| `PATCH` | `/hospital/wait-count` | Staff Bearer | `hospital` | J4 |
| `POST` | `/hospital/bookings/{booking_id}/arrived` | Staff Bearer | `hospital` | J5 |
| `POST` | `/hospital/bookings/{booking_id}/no-show` | Staff Bearer | `hospital` | J5, J3 |

**Scope table**

| Method | Path | Capability |
|--------|------|------------|
| `GET` | `/hospital/queue` | `hospital_staff` of `users.facility_id` only |
| `PATCH` | `/hospital/wait-count` | Same; writes that facility’s `wait_count` |
| `POST` | `/hospital/bookings/{id}/arrived` | Same; booking must belong to that facility |
| `POST` | `/hospital/bookings/{id}/no-show` | Same |

**Lifecycle:** `booked` → `arrived` **or** `no_show`. Repeat POST of the same terminal status is **idempotent** (no second wait decrement). A different terminal status is **409** `conflict`. Instant bookings decrement `facilities.wait_count` in the same transaction (lock facility first). Appointment rows change status only (MVP does not write appointments). Negative wait is forbidden (`wait_count > 0` on decrement; CHECK on the table).

**Identifiers:** booking `id` and facility `id` are integers. Phone is last-4 only (`v_queue_patient_display`). Never `id_number_hmac` / ciphertext.

**Time:** queue “today” for arrived / no-show uses `Africa/Nairobi` on `arrived_at` / `no_show_at`. Open `booked` rows are listed regardless of created day. `created_at` is timestamptz.

**Query vs response casing:** snake_case JSON. `GET /hospital/queue` has no query keys; unknown keys are ignored.

**Soft delete:** none. Booking end-of-life is status, not DELETE.

**Side effects:** arrived / no-show decrement `wait_count` once for instant bookings. Desk `PATCH` sets `wait_count` independently (drift vs `COUNT(*)` of bookings is allowed). No SMS, no notes row, no wait increment.

**Related surfaces** (other chapters):

| Route | Chapter |
|-------|---------|
| `GET /me` | [me.md](me.md) |
| `GET /facilities/recommend` | [facilities.md](facilities.md) — ranking **reads** `wait_count`; it does not write it |
| `POST /bookings` | [bookings.md](bookings.md) — P2 **increments** wait on create |
| `POST /hospital/bookings/{id}/notes` | [notes.md](notes.md) — P5 |

See [conventions.md](conventions.md) and [pagination-sorting-and-query-keys.md](pagination-sorting-and-query-keys.md).

## Shared types

### `FacilityWait`

| JSON key | Type | Notes |
|----------|------|-------|
| `id` | integer | Staff facility primary key. |
| `name` | string | Display name. |
| `kmhfr_code` | string | Registry / seed code. |
| `wait_count` | integer | Desk-typed ranking input. **Not HMIS. Not queue position.** |

### `QueueBooking`

| JSON key | Type | Notes |
|----------|------|-------|
| `id` | integer | Booking primary key. |
| `status` | `"booked"` \| `"arrived"` \| `"no_show"` \| `"cancelled"` | Current status. |
| `booking_kind` | `"instant"` \| `"appointment"` | MVP queue is instant. |
| `queue_position` | integer \| `null` | Derived from `v_instant_queue_positions`. Null when not in the open instant queue. **Not** `wait_count`. |
| `created_at` | string (timestamptz) | ISO-8601. |
| `given_name` | string \| `null` | From `v_queue_patient_display`. May be null when the profile is empty or RLS hides names. |
| `family_name` | string \| `null` | Same. Fallback display is phone last-4. |
| `phone_last4` | string | Last four digits of `users.phone_e164`. |
| `symptom_slugs` | string[] | Catalog slugs on the booking, ordered. |
| `patient_free_text` | string \| `null` | Optional extra text; not triage input. |
| `red_flag_applied` | boolean | Snapshot at book time. |

### `HospitalQueueResponse`

| JSON key | Type | Notes |
|----------|------|-------|
| `facility` | `FacilityWait` | This staff facility only. |
| `bookings` | `QueueBooking[]` | Unpaginated. Open `booked` first (by `created_at`, `id`), then today’s arrived / no-show. |

No cursor or offset wrapper.

### `WaitCountPatch`

| JSON key | Type | Notes |
|----------|------|-------|
| `wait_count` | integer | Required. `>= 0`. Staff override. |

### `WaitCountResponse`

| JSON key | Type | Notes |
|----------|------|-------|
| `facility_id` | integer | Always the staff facility. |
| `wait_count` | integer | Value after the PATCH. |

### `BookingStatusResponse`

| JSON key | Type | Notes |
|----------|------|-------|
| `booking` | `QueueBooking` | Row after the transition. |
| `wait_count` | integer | Facility wait after the mutation. |

## `GET /hospital/queue`

- **Purpose** — Show this facility’s ranking wait and the desk list (open bookings plus arrivals / no-shows dated today in Nairobi).
- **Path parameters** — None.
- **Query parameters** — None. Unknown keys are ignored.
- **Request body** — None.
- **Success response** — `200`:

```json
{
  "facility": {
    "id": 1,
    "name": "Kenyatta National Hospital",
    "kmhfr_code": "SEED-NBO-KNH",
    "wait_count": 12
  },
  "bookings": [
    {
      "id": 10,
      "status": "booked",
      "booking_kind": "instant",
      "queue_position": 1,
      "created_at": "2026-08-29T07:15:00+00:00",
      "given_name": null,
      "family_name": null,
      "phone_last4": "1111",
      "symptom_slugs": ["p4-test-cough"],
      "patient_free_text": null,
      "red_flag_applied": false
    }
  ]
}
```

- **Errors**

| HTTP | `error.code` | When |
|------|----------------|------|
| 401 | `unauthorized` | Missing or invalid Bearer. |
| 403 | `forbidden` | Token is valid but the user is not hospital staff with a facility. |
| 404 | `not_found` | Staff facility row missing (should not happen for demo-staff). |

- **Behaviour notes** — RLS on `bookings` plus `facility_id = staff.facility_id` hide other facilities. `wait_count` is not `COUNT(*)` of the list. Queue position is derived and may be null for closed rows.
- **Try it**

  | Field | Value |
  |-------|-------|
  | `operationId` | `getHospitalQueue` |
  | Tag | `hospital` |

  ```bash
  curl http://localhost:8000/hospital/queue \
    -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
  ```

## `PATCH /hospital/wait-count`

- **Purpose** — Staff override of `facilities.wait_count` for ranking (J4). Walk-ins outside the PWA are why this can differ from the booking list.
- **Path parameters** — None.
- **Query parameters** — None. Unknown keys are ignored.
- **Request body** — `application/json`, `WaitCountPatch`. `wait_count` required, integer `>= 0`.
- **Success response** — `200`:

```json
{
  "facility_id": 1,
  "wait_count": 7
}
```

- **Errors**

| HTTP | `error.code` | When |
|------|----------------|------|
| 401 | `unauthorized` | Missing or invalid Bearer. |
| 403 | `forbidden` | Not hospital staff. |
| 422 | `validation_error` | Missing body, non-integer, or `wait_count < 0`. |

- **Behaviour notes** — `SELECT … FOR UPDATE` on **this** facility only, then `UPDATE`. Never reads or writes another facility. Does not change booking statuses. Does not increment or decrement as a side effect of bookings — those are separate transactions (P2 create / P4 arrived-no-show).
- **Try it**

  | Field | Value |
  |-------|-------|
  | `operationId` | `patchHospitalWaitCount` |
  | Tag | `hospital` |

  ```bash
  curl -X PATCH http://localhost:8000/hospital/wait-count \
    -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"wait_count": 7}'
  ```

## `POST /hospital/bookings/{booking_id}/arrived`

- **Purpose** — Mark the person as met (`arrived`) and decrement wait once for an instant booking (J5).
- **Path parameters**

| Name | Type | Notes |
|------|------|-------|
| `booking_id` | integer `>= 1` | Booking primary key. |

- **Query parameters** — None. Unknown keys are ignored.
- **Request body** — None.
- **Success response** — `200` `BookingStatusResponse`. `booking.status` is `arrived`. `wait_count` is the facility value after the transaction.
- **Errors**

| HTTP | `error.code` | When |
|------|----------------|------|
| 401 | `unauthorized` | Missing or invalid Bearer. |
| 403 | `forbidden` | Not hospital staff. |
| 404 | `not_found` | No booking at **this** facility (including another facility’s id). |
| 409 | `conflict` | Booking is already `no_show` or `cancelled`. |

- **Behaviour notes** — Lock facility then booking. Decrement only if the row left `booked` as `instant` (`wait_count > 0` so a desk PATCH to 0 cannot violate the CHECK). Second POST while already `arrived` returns **200** and does not decrement again. Does not write notes or notify jobs.
- **Try it**

  | Field | Value |
  |-------|-------|
  | `operationId` | `markBookingArrived` |
  | Tag | `hospital` |

  ```bash
  curl -X POST http://localhost:8000/hospital/bookings/10/arrived \
    -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
  ```

## `POST /hospital/bookings/{booking_id}/no-show`

- **Purpose** — Mark did not come (`no_show`) and decrement wait once for an instant booking (J5). P5 sends the J3 SMS.
- **Path parameters** — Same as arrived (`booking_id`).
- **Query parameters** — None. Unknown keys are ignored.
- **Request body** — None.
- **Success response** — `200` `BookingStatusResponse` with `booking.status` `no_show`.
- **Errors** — Same table as arrived (409 if already `arrived` or `cancelled`).
- **Behaviour notes** — Same lock order and idempotency as arrived. Does not send SMS from this handler.
- **Try it**

  | Field | Value |
  |-------|-------|
  | `operationId` | `markBookingNoShow` |
  | Tag | `hospital` |

  ```bash
  curl -X POST http://localhost:8000/hospital/bookings/10/no-show \
    -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
  ```

## Stable error codes and messages

| Code / message | HTTP | When |
|----------------|------|------|
| `unauthorized` / Missing or invalid Firebase ID token. | 401 | Bad or missing Bearer. |
| `forbidden` / Hospital desk is for hospital staff of this facility only. | 403 | Care-seeker or staff without `facility_id`. |
| `not_found` / No booking at this facility matches that id. | 404 | Wrong facility or unknown booking. |
| `conflict` / Booking is already `{status}`; it cannot be marked `{arrived\|no_show}`. | 409 | Other terminal status. |
| `validation_error` | 422 | Negative `wait_count` or invalid path/body. |

## Relationship to other domains

- **Bookings (P2):** `POST /bookings` increments `wait_count`. Hospital routes must not increment.
- **Recommend:** reads `wait_count` after desk PATCH or terminal decrement.
- **Notes (P5):** `POST /hospital/bookings/{id}/notes` is not in this chapter. The desk PWA only **links** to `/hospital/notes`.
- **Notify (P5):** no-show SMS is not sent here.

## Suggested view → API mapping

| Surface | Call |
|---------|------|
| After staff sign-in | `GET /me` then `GET /hospital/queue` |
| Station (`/hospital`) | Same queue payload; call next is local serving until send onwards, visit complete, or did not come |
| Unassigned → department | Local assign on the desk (staff sets department; care-seeker does not) |
| Send onwards (next desk / room) | Local transfer; ticket stays `booked`; **does not** decrement wait |
| People-waiting control (`/hospital/config`) | `PATCH /hospital/wait-count` |
| Visit complete / mark as met | `POST /hospital/bookings/{id}/arrived` then refresh queue |
| Did not come | `POST /hospital/bookings/{id}/no-show` then refresh queue |
| Notes | Navigate to `/hospital/notes?booking_id=` (P5 page) |

## Frontend notes

- Import P3 `lib/auth.ts` and `lib/api/client.ts`. Hospital methods live in `lib/api/hospital.ts` only.
- Send `Authorization: Bearer …` on every hospital call (client helper).
- 401 → signed out. 403 → care-seeker session; do not show another facility’s queue.
- Treat `wait_count` and `queue_position` as different facts. Copy should not say “queue length” for the wait control.
- Display name: `given_name` + `family_name`, else phone last-4. Never show full phone or ID numbers.
- Staff PWA mirrors a station terminal (`/hospital`) plus facility config (`/hospital/config`). One facility only. No ambulance dispatch.
- **Mark as met** can send the person to another department or room (ticket stays open) or **Visit complete** (arrived, wait decrements). Wait does not change on transfer.
- Link to `/hospital/notes`; do not build notes routes in the desk tree.
- Do not cache queue or wait in the service worker.

## Implementation status snapshot (backend)

| Area | Status |
|------|--------|
| `GET /hospital/queue` | **Implemented** in `backend/app/hospital/` |
| `PATCH /hospital/wait-count` | **Implemented** |
| `POST …/arrived` and `…/no-show` (decrement) | **Implemented** |
| Router include on `app.main` | **Handshake to P1** — export is `app.hospital.router` |
| `POST /hospital/bookings/{id}/notes` | **Not implemented here** (P5) |
| SMS on no-show | **Not implemented here** (P5) |

## Reference files

- Route: `backend/app/hospital/router.py` (P1 includes from `backend/app/main.py`)
- Guard: `backend/app/hospital/deps.py` (`require_hospital_staff`)
- Persistence: `backend/app/hospital/service.py`
- Schemas: `backend/app/hospital/schemas.py`
- Auth identity: `backend/app/auth/deps.py` (`get_current_user`)
- Errors: `backend/app/core/errors.py`
- Tests: `backend/app/hospital/tests/test_hospital.py` (not `backend/tests/`)
- OpenAPI: re-export after P1 includes the router (`python -m app.export_openapi`)
