# Bookings (create)

Journey **J1** / **J2**: care-seeker books a recommended facility. This is an **instant** booking. It **increments** `wait_count`. Decrement is P4. SMS is P5.

## Domain context

`POST /bookings` creates `booking_kind=instant`, `booking_channel=ranked_recommend`, freezes a facility snapshot, and bumps desk wait by 1 in the same transaction.

**Base path:** `/bookings` (no `/v1`). This chapter documents **`POST /` (create) only**.

**Authentication:** Firebase Bearer. Role must be `patient`. Staff → **403** `forbidden`.

| Method | Path | Auth | OpenAPI tag |
|--------|------|------|-------------|
| `POST` | `/bookings` | patient | `bookings` |

**Hub status:** router is in `backend/app/bookings/router.py`. **Not mounted** until P1 `include_router` in `backend/app/main.py` (see [merge-clash-avoidance.md](../../plans/merge-clash-avoidance.md)).

**Side effects:** `facilities.wait_count + 1`. Snapshot `wait_count_at_book` is the value **before** the bump. No notify job.

**Related surfaces:** [symptoms.md](symptoms.md), [facilities.md](facilities.md).

See [conventions.md](conventions.md).

## Shared types

### `CreateBookingRequest`

| JSON key | Type | Notes |
|----------|------|-------|
| `facility_id` | integer | From recommend `id` |
| `symptom_ids` | string[] | 1–20 catalog **slugs** from map (`chest-pain`). Each slug is lowercase letters/numbers joined by hyphens, at most 100 characters. |
| `notify_locale` | string or omit | Default: caller's `ui_locale`. Enum includes `en`/`sw` plus local langs. |
| `patient_free_text` | string or omit | Optional extra text. Not used for KEPH. |

### `CreateBookingResponse`

| JSON key | Type | Notes |
|----------|------|-------|
| `id` | integer | Booking id |
| `status` | string | `booked` |
| `facility_id` | integer | |
| `facility` | object | Frozen snapshot (name, KEPH, coords, `wait_count_at_book`) |
| `keph_min_applied` | integer | Computed from catalog rows, not from the client |
| `red_flag_applied` | boolean | Same |
| `symptom_ids` | string[] | Slugs as submitted (deduped, order kept) |

## `POST /bookings`

- **Purpose** — Instant book after recommend; increment wait (J1/J2).
- **Path parameters** — None.
- **Query parameters** — None.
- **Request body** — `CreateBookingRequest`.
- **Success response** — `200` with `CreateBookingResponse`.
- **Errors**

| HTTP | `error.code` | When |
|------|----------------|------|
| 401 | `unauthorized` | Missing/invalid Bearer |
| 403 | `forbidden` | Caller is not a patient |
| 404 | `facility_not_found` | Unknown or non-operational facility |
| 409 | `facility_below_keph_min` | Selected facility is below the symptom-derived KEPH floor |
| 422 | `unknown_symptom` | Slug not in catalog |
| 422 | `validation_error` | Empty `symptom_ids` or bad locale |

- **Behaviour notes**
  - Lock facility `FOR UPDATE`, then insert parent + `booking_instant` + `booking_symptoms` + snapshot, then `wait_count + 1`.
  - KEPH/red flag recomputed from catalog (client cannot spoof a lower floor).
  - The locked facility must meet the computed KEPH floor; otherwise no booking or wait increment is committed.
  - No appointment subtype. No wait decrement.
- **Try it** — 404 until P1 mounts the router.

```bash
curl -s -X POST http://localhost:8000/bookings \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"facility_id":1,"symptom_ids":["chest-pain"]}'
```

## Stable error codes and messages

| Code | HTTP | When |
|------|------|------|
| `forbidden` | 403 | Staff (or non-patient) calling create |
| `facility_not_found` | 404 | Not operational / missing |
| `facility_below_keph_min` | 409 | Facility KEPH level is lower than the computed symptom floor |
| `unknown_symptom` | 422 | Bad slug |

## Relationship to other domains

P4 marks arrived/no-show and decrements wait. P5 sends SMS from the booking id. Do not increment wait in hospital routes.

## Suggested view → API mapping

| Surface | Call |
|---------|------|
| Care-seeker confirm book | `POST /bookings` after map + recommend |

## Frontend notes

- Use recommend `id` as `facility_id` and map slugs as `symptom_ids`.
- Show snapshot `name`, `keph_level`, `wait_count_at_book` on the confirmation screen (J1 step 6).
- 403 means the session is a hospital login; send them to `/hospital`.
- Route is 404 until P1 include.

## Implementation status snapshot (backend)

| Area | Status |
|------|--------|
| Instant create + wait +1 | **Implemented** (package) |
| Mounted on `main.py` | **Not implemented** (P1 handshake) |
| Arrived / no-show decrement | **Out of scope** (P4) |

## Reference files

- Route: `backend/app/bookings/router.py`
- Create txn: `backend/app/bookings/create.py`
- Rules: `backend/app/triage/rules.py`
- Tests: `backend/app/bookings/tests/test_create.py`
