# P2 progress log

| Field | Value |
|-------|-------|
| Document type | Working log |
| Version | 0.2 |
| Status | Draft |
| Owner | Moses (P2) |
| Last updated | 2026-08-29 |
| Related documents | [p2-wave1-plan.md](p2-wave1-plan.md), [p2-decisions.md](p2-decisions.md) |
| Prerequisites | [p2-wave1-plan.md](p2-wave1-plan.md) |
| Revision summary | Close Wave 1 handshake copy-paste; packages still unmounted |

Newest first.

| Date | Phase | Status | Notes |
|------|-------|--------|-------|
| 2026-08-29 | Close Wave 1 handshake | **Notes only** | [handshake-p1.md](handshake-p1.md) v0.2: exact `main.py` imports/includes, description, `OPENAPI_TAGS`, bookings Bearer lock, README rows, `export_openapi`. Send to Ethan. |
| 2026-08-29 | Wave 2 triage extract | **On origin/dev** | `backend/app/triage/rules.py`. No HTTP. Map and book import it. |
| 2026-08-29 | 4. Instant bookings | **On origin/dev** | `POST /bookings` wait +1. Patient auth. Not on `main.py`. Decrement is still P4. |
| 2026-08-29 | 3. Map API | **On origin/dev** `ffdf6e3` | Hash map. Handshake still open. |
| 2026-08-29 | 2. Symptom catalog | **On origin/dev** `c793cdd` | 52-row JSON. |
| 2026-08-29 | 1. Red-flag ranking | **On origin/dev** `9f47017` | `red_flag` query. |

## Phase 1 files (landed)

- `backend/app/facilities/ranking.py`, `router.py`, `tests/`
- `docs/api/facilities.md`, pagination, Postman, `backend/openapi/openapi.yaml`
- `mosescodes/` map, decisions, wave plan

## After this slice

Next chat: [START-HERE.md](START-HERE.md). Send Ethan [handshake-p1.md](handshake-p1.md) v0.2. Do not rebase onto `upstream/dev` until it actually moves.
