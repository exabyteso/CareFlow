# Handshake for P1 (Ethan): map and bookings

| Field | Value |
|-------|-------|
| Document type | Hub handshake |
| Version | 0.2 |
| Status | Waiting on P1 |
| Owner | Moses (P2) |
| Last updated | 2026-08-29 |
| Related documents | [p2-wave1-plan.md](p2-wave1-plan.md), [merge-clash-avoidance.md](../plans/merge-clash-avoidance.md), [symptoms.md](../docs/api/symptoms.md), [bookings.md](../docs/api/bookings.md) |
| Prerequisites | Map and bookings packages on `origin/dev` (unmounted) |
| Revision summary | Copy-paste hub lines so map and bookings are live |

P2 does not edit hub files. Paste the snippets below so `POST /symptoms/map` and `POST /bookings` are on the live app. Domain chapters already exist. Postman already has **Map symptoms** and **Create booking**.

**Auth:** map is public (D-P2-04; Bearer ignored). Bookings require patient Bearer via `get_current_user`. P2 already checks `user.role` in the bookings router.

**Seed:** do not add a boot-seed call. The first `POST /symptoms/map` lazy-seeds the catalog and hash vectors, same pattern as recommend.

## `backend/app/main.py`

Match the facilities import style.

**Imports** (next to `facilities_router`):

```python
from app.symptoms.router import router as symptoms_router
from app.bookings.router import router as bookings_router
```

**Description** (replace the "Three live routes only" sentence):

```python
    description=(
        "Kenya pretriage API. There is no `/v1` prefix. "
        "Live routes: `GET /health`, `GET /me`, `GET /facilities/recommend`, "
        "`POST /symptoms/map`, and `POST /bookings`."
    ),
```

**Includes** (immediately after `app.include_router(facilities_router)`):

```python
app.include_router(symptoms_router)
app.include_router(bookings_router)
```

## `backend/app/core/openapi.py`

**Tags** (append to `OPENAPI_TAGS`; not optional):

```python
    {
        "name": "symptoms",
        "description": "Utterance to catalog symptom ids (J1 / J8 text path)",
    },
    {
        "name": "bookings",
        "description": "Instant booking create; increments wait_count (J1 / J2)",
    },
```

**Bearer lock for POST `/bookings`:** bookings use `Header()` via `get_bearer_token`, same as `GET /me`. Without this, Swagger shows a raw Authorization parameter instead of the Bearer lock. Do **not** force Bearer on public `POST /symptoms/map`.

Replace the `me_get = ...` block with:

```python
    def _apply_bearer_lock(path: str, method: str) -> None:
        operation = schema.get("paths", {}).get(path, {}).get(method)
        if not isinstance(operation, dict):
            return
        operation["security"] = [{bearer_scheme.scheme_name: []}]
        params = operation.get("parameters")
        if isinstance(params, list):
            operation["parameters"] = [
                param
                for param in params
                if not (
                    isinstance(param, dict)
                    and str(param.get("name", "")).lower() == "authorization"
                )
            ]

    _apply_bearer_lock("/me", "get")
    _apply_bearer_lock("/bookings", "post")
```

## `docs/api/README.md`

P1 owns this file. Domain chapters [symptoms.md](../docs/api/symptoms.md) and [bookings.md](../docs/api/bookings.md) already exist.

**Related material** domain-chapters bullet: add:

```markdown
[symptoms](symptoms.md), [bookings](bookings.md)
```

**Route map:** drop "Three live routes only." Add rows:

| Method | Path | Purpose | Chapter |
|--------|------|---------|---------|
| `POST` | `/symptoms/map` | Utterance to catalog ids (J1 / J8) | [symptoms.md](symptoms.md) |
| `POST` | `/bookings` | Instant book; wait **increment** | [bookings.md](bookings.md) |

**operationId table** (copy exactly; Postman names already match):

| Method | Path | operationId | Postman request name | Tag |
|--------|------|-------------|----------------------|-----|
| `POST` | `/symptoms/map` | `mapSymptoms` | Map symptoms | `symptoms` |
| `POST` | `/bookings` | `createBooking` | Create booking | `bookings` |

Drop the paragraph that says bookings and symptoms/map are not on this surface.

## After include

From `backend/`:

```bash
python -m app.export_openapi
```

P2 does not hand-edit `backend/openapi/openapi.yaml`.

## Deferred schema handshake: booking retries

`POST /bookings` does not yet have a durable idempotency key. A mobile/network retry can therefore create a second booking and increment `wait_count` again. Resolving this requires a P1-owned Alembic change and an agreed request-header contract; it is not safe to simulate with process-local state. Track this before treating booking retries as production-safe.

## Do not

| Item | Why |
|------|-----|
| `sentence-transformers` / pyproject extra | Wave 1 map is `careflow-hash-v1`. e5-small is a later handshake. |
| `ensure_symptom_catalog` in `app/seed.py` | Map lazy-seeds on first request. |
| Alembic `0002` | Embedding dim is already 384. |
| `require_patient` in `auth/deps.py` | Bookings check `user.role` in `bookings/router.py`. |
| `include_router` for `app.triage` | `triage/` is rules only. No APIRouter. |
| Force Bearer on `/symptoms/map` | Public in Wave 1 (D-P2-04). |
| Decrement `wait_count` | P4 owns arrived / no-show. |
