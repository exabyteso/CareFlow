# API conventions

Cross-cutting behaviour for JSON routes registered on the FastAPI app in `backend/app/main.py`. This chapter is the **shared contract** for frontend agents and maintainers; domain-specific routes live in the chapters linked below.

**Machine-readable contract:** handler code, Pydantic models, generated OpenAPI, and integration tests—not this prose. When sources disagree: **runtime handlers → generated OpenAPI → this prose**. See [README](README.md) for Swagger, ReDoc, the committed spec, and Postman artefacts.

**Authoring standard for domain chapters:** [AGENTS.md](AGENTS.md).

---

## Path prefix

| Concept | Detail |
|---------|--------|
| **Prefix** | **None.** Product REST paths are `/health`, `/me`, `/facilities/recommend` with **no `/v1`** (and no other mount prefix). |
| **Health / probes** | `GET /health` is unprefixed, unauthenticated, and does not ping the database. |
| **Path params** | Brace names in chapters match FastAPI route modules. |

---

## Authentication and authorisation

Firebase **ID tokens** only. There is **no public email-register / self-signup form**; Google and email/password sign-in remain. Care-seekers are provisioned on the first valid token if the UID is missing from `users`. Hospital staff remain invite-only (seeded `demo-staff` plus operator-seeded rows). Demo accounts `demo-patient` / `patient@careflow.local` (care-seeker) and `demo-staff` / `staff@careflow.local` (hospital staff) apply to **localhost and staging** ([careflow-web.onrender.com](https://careflow-web.onrender.com)), not production. Same Firebase project `careflow-kenya`; Postgres rows are per environment.

| Topic | Detail |
|-------|--------|
| **Credentials** | `Authorization: Bearer <Firebase ID token>` |
| **Validation** | Firebase Admin (`app.auth.firebase.verify_id_token`). Missing/invalid token → **401** `unauthorized`. |
| **Route guards** | `get_current_user` on `GET /me`. Recommend is public (optional Bearer is ignored). Health has no auth. |
| **Provisioning** | Care-seeker: valid token whose UID is not in `users` → INSERT `role=patient`, `facility_id=NULL`, `ui_locale=en`. **404** `user_not_provisioned` only if that insert fails (not for a first-time Google user). Staff are not auto-provisioned; an unknown UID on `/hospital/*` is inserted as a patient then **403** `forbidden`. |
| **Roles** | JSON `role` is `patient` (care-seeker) or `hospital_staff`. Hospital staff sessions carry `facility_id` (this facility only). |

---

## Money, time, and identifiers

No money fields on the current surface. Facility primary keys are integers (`id`); Kenya Master Health Facility Registry codes are strings (`kmhfr_code`). Query keys and JSON bodies both use **snake_case**. Distances are metres (`distance_m`). Coordinates are WGS84 `lat` / `lng`. Kenya bounding box for recommend: lat −5.0–5.6, lng 33.5–42.2.

`wait_count` is a **desk-typed demo ranking input**, not a live HMIS feed and not queue position (INV-16, X-08).

---

## Errors

Envelope for all JSON errors:

```json
{ "error": { "code": "<stable>", "message": "<human>" } }
```

| HTTP | Default `code` | Notes |
|------|----------------|-------|
| 400 | `bad_request` | Overridden when the handler sets a stable code (e.g. `location_out_of_range`). |
| 401 | `unauthorized` | Missing or invalid Bearer token. |
| 404 | `not_found` | Overridden for `user_not_provisioned` on `/me`. |
| 422 | `validation_error` | FastAPI/Pydantic request validation (missing `lat`/`lng`, `keph_min` out of range). |
| 500 | `internal_error` | Unhandled exception; message is generic. |

CORS: `FRONTEND_ORIGIN` (default `http://localhost:3000`). `DEMO_NOTIFY=1` never live-dials.

---

## Related chapters

- [Health](health.md) — `GET /health`
- [Me](me.md) — `GET /me`
- [Facilities](facilities.md) — `GET /facilities/recommend` (J7 only)
