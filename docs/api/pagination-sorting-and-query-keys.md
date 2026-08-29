# Pagination, sorting, and query keys

Master reference for **list endpoints** on the CareFlow API. Domain chapters should link here instead of duplicating pagination rules.

**Machine-readable contract:** handler validation, generated OpenAPI, and tests—not this prose. When sources disagree: **runtime handlers → generated OpenAPI → this prose**.

---

## Models in use

| Model | Used by | Notes |
|-------|---------|-------|
| Unpaginated array | `GET /facilities/recommend` | Body `{ "facilities": [ … ] }`. No cursor, limit, or offset. |
| Cursor | — | Not used. |
| Offset (`limit` / `offset` or `page`) | — | Not used. |

---

## Endpoint master table

| Method | Path | Pagination | Sort allowlist | Filter notes |
|--------|------|--------------|----------------|--------------|
| `GET` | `/facilities/recommend` | None (full array) | Routine: `wait_count ASC`, then `earth_distance ASC`. Red flag (`red_flag=true`): `earth_distance ASC` only. | `operational`; `keph_level >= keph_floor`. Routine floor is `keph_min` (default 2). Red-flag floor is `max(4, keph_min)`. Query: `lat`, `lng`, `keph_min`, `red_flag`. Unknown keys ignored. |

`wait_count` is a desk-typed demo ranking input, **not HMIS**.

Bookings, symptoms, voice, hospital queue, and wait `PATCH` are not on this surface yet — no list contracts for them here.

---

## Query key conventions

- Snake_case query keys.
- Unknown keys: **ignored** (FastAPI default).
- No client sort tokens on this surface.

---

## Maintenance

When a list contract changes, update this file and the domain chapter in the **same PR**. Re-export OpenAPI from `backend/` with `python -m app.export_openapi` (`OPENAPI_PATH=backend/openapi/openapi.yaml`). See [AGENTS.md](AGENTS.md) and [README.md](README.md).
