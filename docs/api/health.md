# Health

Liveness probe for the CareFlow API.

## Domain context

`GET /health` tells Compose, operators, and the PWA that the **API process is up**. It does not check Postgres, Firebase, or seed data. Path has **no `/v1` prefix**. No authentication. See [conventions.md](conventions.md).

**Authentication:** none. No Bearer header.

| Method | Path | Auth | OpenAPI tag |
|--------|------|------|-------------|
| `GET` | `/health` | None | `health` |

No write routes — no request-body types. No money, time, pagination, or identifier conventions on this route. No side effects.

**Related surfaces** (other chapters):

| Route | Chapter |
|-------|---------|
| `GET /me` | [me.md](me.md) |
| `GET /facilities/recommend` | [facilities.md](facilities.md) |

## Shared types

Not reused elsewhere. Success body is documented on the route.

## `GET /health`

- **Purpose** — Liveness for local Compose and deploy probes. Does not prove the database is migrated or seeded.
- **Path parameters** — None.
- **Query parameters** — None. Unknown keys are ignored.
- **Request body** — None.
- **Success response** — `200`:

```json
{ "status": "ok" }
```

- **Errors** — None specific to this route. Malformed requests still use the shared envelope in [conventions.md](conventions.md).
- **Behaviour notes** — No database ping. Safe to call from the PWA or `curl localhost:8000/health` after `docker compose up`.
- **Try it**

  | Field | Value |
  |-------|-------|
  | `operationId` | `getHealth` |
  | Postman request | Get health |
  | Tag | `health` |

  ```bash
  curl http://localhost:8000/health
  ```

## Stable error codes and messages

No domain-specific codes. Generic HTTP errors use the shared envelope.

## Relationship to other domains

Does not imply `/me` or `/facilities/recommend` will succeed (those need a migrated database; `/me` also needs a provisioned user).

## Suggested view → API mapping

| Surface | Call |
|---------|------|
| Local verify / Compose health | `GET /health` |
| PWA | Optional connectivity check; not required to render `/` |

## Frontend notes

- Treat anything other than `200` + `status: "ok"` as API down.
- Do not cache this response in the service worker (online-only SW).

## Implementation status snapshot (backend)

| Area | Status |
|------|--------|
| `GET /health` | **Implemented** |
| Readiness (DB ping) | **Not implemented** |

## Reference files

- Route: `backend/app/core/health.py` (included from `backend/app/main.py`)
- Schema: `HealthResponse` in `backend/app/core/health.py`
- CORS / app: `backend/app/main.py`
- OpenAPI: `backend/openapi/openapi.yaml` (`operationId` `getHealth`, tag `health`)
- Tests: `backend/tests/test_health.py`
