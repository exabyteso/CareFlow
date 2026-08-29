# Backend (`backend/`)

FastAPI (Python 3.12) for CareFlow Kenya pretriage. Persistence is **PostgreSQL 16 + pgvector** ([D-001](../research/decision-log.md)). Compose services are `db` + `api`. Routes have **no `/v1` prefix**: `GET /health`, `GET /me`, `GET /facilities/recommend`.

## Key files

| File | Role |
|------|------|
| `Dockerfile` | API image; `ENTRYPOINT` is `docker/entrypoint.sh` |
| `docker/entrypoint.sh` | Boot: Alembic migrate, then `python -m app.seed`, then uvicorn on 8000 |
| `app/seed.py` | Boot seed module (demo Auth users + DB rows) |
| `alembic/versions/0001_product_schema.py` | First revision — product DDL |
| `app/core/` | Settings, DB sessions, error envelope, health |
| `app/auth/` | Firebase Bearer, `GET /me`, lazy demo UID seed |
| `app/facilities/` | `GET /facilities/recommend` (J7 routine, J2 `red_flag`) |
| `app/symptoms/` | Catalog JSON, hash vectors, `POST /symptoms/map` (unmounted until P1) |
| `app/bookings/` | `POST /bookings` instant + wait increment (unmounted until P1) |
| `data/kenya-symptoms.json` | Starter pretriage catalog (en/sw + some local langs) |
| `openapi/openapi.yaml` | Committed OpenAPI; Swagger UI at `http://localhost:8000/docs` |
| `data/nairobi-facilities.json` | Nairobi seed when `facilities` is empty |

First-time compose, demo accounts, and curl: [ONBOARDING.md](../ONBOARDING.md). Tests: [docs/testing-reference.md](../docs/testing-reference.md).

## Related

- [docs/api/](../docs/api/) — human + agent HTTP reference; Postman JSON (`CareFlow.postman_collection.json`, `CareFlow.postman_environment.json`)
- [research/ops/](../research/ops/) — stack and vendor research
- [Repository root](../README.md)
- [ONBOARDING.md](../ONBOARDING.md)
