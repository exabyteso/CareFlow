# Me (current user)

Who is signed in: care-seeker or hospital staff for this session.

## Domain context

`GET /me` returns the CareFlow `users` row for a verified Firebase ID token. Care-seekers are auto-provisioned on first valid token (`role=patient`, `facility_id=null`, `ui_locale=en`). Hospital staff remain invite-only (`demo-staff` seed). There is **no public email-register / self-signup form**; Google and email/password sign-in remain. Demo emails `patient@careflow.local` (`demo-patient`) and `staff@careflow.local` (`demo-staff`) work on **localhost and staging** ([careflow-web.onrender.com](https://careflow-web.onrender.com)) — same Firebase project `careflow-kenya`; Postgres rows are per environment.

**Base path:** `/me` (no `/v1`).

**Authentication:** `get_current_user` (`app.auth.deps`). Header `Authorization: Bearer <Firebase ID token>`. After a successful lookup, the handler sets RLS GUCs for later queries on the same session.

Runtime verification uses `get_bearer_token` (the `Authorization` header), not FastAPI `HTTPBearer` as a route dependency. OpenAPI still advertises the `HTTPBearer` security scheme on this operation for Swagger and Postman.

| Method | Path | Auth | OpenAPI tag |
|--------|------|------|-------------|
| `GET` | `/me` | Required Bearer | `auth` |

**Roles:** JSON `role` is `patient` (care-seeker) or `hospital_staff` (hospital desk). Staff must have a `facility_id` (this facility only). Care-seekers have `facility_id: null`.

**Identifiers:** `firebase_uid` is the Firebase UID string. `facility_id` is an integer facility primary key when present.

**Query vs response casing:** no query keys. JSON body is snake_case.

See [conventions.md](conventions.md). No money fields. No pagination. No write routes — no request-body types.

**Related surfaces** (other chapters):

| Route | Chapter |
|-------|---------|
| `GET /health` | [health.md](health.md) |
| `GET /facilities/recommend` | [facilities.md](facilities.md) |

## Shared types

### `MeResponse`

| JSON key | Type | Notes |
|----------|------|-------|
| `firebase_uid` | string | Firebase UID. Demo values: `demo-patient` (`patient@careflow.local`), `demo-staff` (`staff@careflow.local`). |
| `role` | `"patient"` \| `"hospital_staff"` | Product language: care-seeker vs hospital staff/desk. |
| `facility_id` | integer \| `null` | Set for hospital staff; `null` for care-seekers. |
| `locale` | string | UI locale from `users.ui_locale` (demo seed is `en`). |
| `phone_e164` | string | E.164 phone on the user row. |

No wrapper; the object is the response body.

## `GET /me`

- **Purpose** — Return the provisioned CareFlow user for this Firebase account so the PWA can choose care-seeker vs hospital-desk chrome.
- **Path parameters** — None.
- **Query parameters** — None. Unknown keys are ignored.
- **Request body** — None.
- **Success response** — `200`:

```json
{
  "firebase_uid": "demo-patient",
  "role": "patient",
  "facility_id": null,
  "locale": "en",
  "phone_e164": "+254711111111"
}
```

Hospital staff example: `firebase_uid` `demo-staff` (`staff@careflow.local`), `role` `hospital_staff`, `phone_e164` `+254722222222`, `facility_id` set to the seeded Kenyatta National Hospital row (`kmhfr_code` `SEED-NBO-KNH`).

- **Errors**

| HTTP | `error.code` | When |
|------|----------------|------|
| 401 | `unauthorized` | Missing header, not `Bearer`, empty token, or Firebase verification failed (including Admin SDK not configured). |
| 404 | `user_not_provisioned` | Token is valid but the care-seeker INSERT could not complete (phone unique exhausted, database error). Not returned for a first-time Google user when the insert succeeds. |
| 422 | `validation_error` | Not expected for this route (no query/body schema). Documented as `ErrorEnvelope` to match the global validation handler. |

- **Behaviour notes** — If the verified UID is missing from `users`, the handler **INSERT**s a care-seeker (`role=patient`, `facility_id=NULL`, `ui_locale=en`) with `ON CONFLICT DO NOTHING`. Phone is the token `phone_number` when it matches `^\+254[17][0-9]{8}$`; otherwise a deterministic synthetic `+2547XXXXXXXX` that is never the demo numbers `+254711111111` / `+254722222222`. Hospital staff are **not** auto-provisioned. **404** `user_not_provisioned` only if that insert cannot complete — not for a first-time Google user. Demo rows `demo-patient` / `demo-staff` are inserted if missing (and Nairobi facilities are seeded if the table is empty). Compose boot seed (`python -m app.seed`) is additive — it provisions the same demo rows (and Firebase Auth users when `FIREBASE_*` is set) at API start. Lazy-seed on `/me` still runs if rows are missing. `DEMO_NOTIFY` does not affect this route. Runtime still reads `Authorization` via `get_bearer_token`; OpenAPI advertises HTTP Bearer only. A missing or invalid Bearer still returns **401** `unauthorized`.
- **Try it**

  | Field | Value |
  |-------|-------|
  | `operationId` | `getMe` |
  | Postman request | Get me |
  | Tag | `auth` |

  Replace the placeholder with a Firebase ID token (never a real secret in this chapter).

  ```bash
  curl http://localhost:8000/me \
    -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
  ```

## Stable error codes and messages

| Code / message | HTTP | When |
|----------------|------|------|
| `unauthorized` / Missing or invalid Firebase ID token. | 401 | Bad or missing Bearer. |
| `user_not_provisioned` / No CareFlow user is provisioned for this Firebase account. | 404 | Valid token, but the care-seeker INSERT could not complete. |

## Relationship to other domains

Hospital desk UI must use `facility_id` from `/me` — never a care-seeker-picked facility. Recommend ([facilities.md](facilities.md)) does not require this route.

## Suggested view → API mapping

| Surface | Call |
|---------|------|
| After sign-in (care-seeker or desk) | `GET /me` then route to `/patient` or `/hospital` |
| Hospital desk “this facility only” | Read `facility_id`; do not list other facilities as the staff workplace |

## Frontend notes

- Send `Authorization: Bearer …` on every `/me` call.
- 401 → signed-out / retry token.
- Google first-time sign-in should **200** as `role: "patient"`. **404** `user_not_provisioned` is rare (insert failure), not “unknown Google”.
- Do not invent a registration / email-register form this pass.
- Map `role: "patient"` to care-seeker chrome; `hospital_staff` to desk chrome. An unknown UID that then hits `/hospital/*` is a patient and those routes return **403** `forbidden` (staff remain invite-only).
- Do not cache `/me` in the service worker.

## Implementation status snapshot (backend)

| Area | Status |
|------|--------|
| `GET /me` | **Implemented** |
| Unknown-UID care-seeker provision | **Implemented** |
| Staff auto-provision (`hospital_staff`) | **Not implemented** (intentional) |
| Public email-register / self-signup form | **Not implemented** (intentional) |
| Firebase Admin in production | Needs `FIREBASE_*` via Phantom |

## Reference files

- Route: `backend/app/auth/router.py`
- Guard: `backend/app/auth/deps.py` (`get_bearer_token`, `get_current_user`)
- Token verify: `backend/app/auth/firebase.py`
- Demo seed: `backend/app/auth/seed.py`
- Errors: `backend/app/core/errors.py`
- OpenAPI: `backend/openapi/openapi.yaml` (`operationId` `getMe`, tag `auth`, `HTTPBearer` scheme)
- Tests: `backend/tests/test_me.py`, `backend/app/auth/tests/`
