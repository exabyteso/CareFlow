# CareFlow HTTP API reference (`docs/api/`)

Human-oriented documentation for the REST surface registered in `backend/app/main.py`. It explains **query contracts**, **auth**, and **error envelopes** that are easy to misread from handlers or OpenAPI alone.

**Machine-readable contract:** FastAPI handlers, Pydantic models, generated OpenAPI, and tests—not this prose.

**Precedence when sources disagree:** runtime handlers → generated OpenAPI → this prose.

**Related material**

- [Conventions](conventions.md) — no `/v1` prefix, auth, errors.
- [Pagination, sorting, and query keys](pagination-sorting-and-query-keys.md) — recommend is an unpaginated array.
- [AGENTS.md](AGENTS.md) — authoring contract for agents writing or refreshing domain chapters.
- Domain chapters: [health](health.md), [me](me.md), [facilities](facilities.md).

## Interactive docs and artefacts

| Surface | Location |
|---------|----------|
| Swagger UI | `http://localhost:8000/docs` |
| ReDoc | `http://localhost:8000/redoc` |
| Runtime schema | `http://localhost:8000/openapi.json` |
| Committed spec | [`backend/openapi/openapi.yaml`](../../backend/openapi/openapi.yaml) (`OPENAPI_PATH=backend/openapi/openapi.yaml`) |
| Postman collection | [CareFlow.postman_collection.json](CareFlow.postman_collection.json) |
| Postman environment | [CareFlow.postman_environment.json](CareFlow.postman_environment.json) |

Export the committed YAML from `backend/` (needs the `[dev]` extra, same as pytest): `python -m app.export_openapi`.

## Route map

Paths have **no prefix** (no `/v1`). Three live routes only.

| Method | Path | Purpose | Chapter |
|--------|------|---------|---------|
| `GET` | `/health` | Liveness probe | [health.md](health.md) |
| `GET` | `/me` | Current provisioned user | [me.md](me.md) |
| `GET` | `/facilities/recommend` | Rank facilities (J7) | [facilities.md](facilities.md) |

**OpenAPI `operationId`, Postman request name, and tag** (copy exactly):

| Method | Path | operationId | Postman request name | Tag |
|--------|------|-------------|----------------------|-----|
| `GET` | `/health` | `getHealth` | Get health | `health` |
| `GET` | `/me` | `getMe` | Get me | `auth` |
| `GET` | `/facilities/recommend` | `recommendFacilities` | Recommend facilities | `facilities` |

Bookings, symptoms/map, voice, hospital queue, and wait `PATCH` are **not** documented here — they are not on this surface (P1–P5 work lands later).

## Maintaining this documentation

Use this section when changing the HTTP surface.

**Precedence when sources disagree**

1. **Runtime handlers** — Handler code, Pydantic models, status codes, and serializers define what clients receive.
2. **Generated OpenAPI** — Runtime `http://localhost:8000/openapi.json` and committed `backend/openapi/openapi.yaml`.
3. **This prose** — Human companion only.

**Same-PR discipline**

Any change that alters routes, query contracts, bodies, or status codes should, in the **same PR**, update the relevant `docs/api/*.md` (route map row if needed), regenerate OpenAPI (`python -m app.export_openapi` from `backend/`), and run the backend tests in [testing-reference.md](../testing-reference.md).

**Parity checklist before merge**

- Every shipped route appears in the route map above (or a linked chapter covers it explicitly).
- List handlers: documented query keys match validation in code.
- New pagination or sort behaviour appears in [pagination-sorting-and-query-keys.md](pagination-sorting-and-query-keys.md).
- Document intentional JSON quirks so they are not "corrected" away.
- Committed YAML matches `app.openapi()` (see `backend/tests/test_openapi.py`).

**What not to do**

- Do not invent a `/v1` prefix.
- Do not treat this prose as authoritative for machine consumers—handlers, then OpenAPI, then this prose.
- Do not hand-edit `backend/openapi/openapi.yaml`; re-export from the app.

**Authoring:** follow [AGENTS.md](AGENTS.md).
