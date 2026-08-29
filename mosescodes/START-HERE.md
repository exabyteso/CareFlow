# Start here (next chat)

| Field | Value |
|-------|-------|
| Document type | New-session handoff |
| Version | 0.2 |
| Status | Ready for a fresh agent |
| Owner | Moses (P2) |
| Last updated | 2026-08-29 |
| Related documents | [p2-progress.md](p2-progress.md), [handshake-p1.md](handshake-p1.md), [p2-decisions.md](p2-decisions.md) |
| Prerequisites | Branch `dev` tracking `origin/dev` |
| Revision summary | Handoff after Close Wave 1 handshake; wait for P1 mount |

You are **P2 (Moses)** on CareFlow Kenya pretriage. Do not rebuild Wave 0. Do not edit hub files. Do not touch the frontend.

## Attach first

- [plans/merge-clash-avoidance.md](../plans/merge-clash-avoidance.md)
- [plans/team-issues.md](../plans/team-issues.md) §P2
- [plans/user-journeys.md](../plans/user-journeys.md)
- [plans/product-spec.md](../plans/product-spec.md)
- [plans/product-schema.md](../plans/product-schema.md) (book + wait lock order)
- This folder: decisions, progress, handshake

## Git

- Branch: **`dev`**
- Fork: `origin` = `CamlineKe/CareFlow` (we can push)
- Team: `upstream` = `exabyteso/CareFlow` (no write from CamlineKe)
- P2 commits on origin/dev include ranking, catalog, map, unmounted bookings, and Close Wave 1 handshake notes
- Handshake for Ethan is copy-paste ready: [handshake-p1.md](handshake-p1.md)
- P1 has **not** landed on `upstream/dev` (still the names-doc commit). Skip waiting unless the user says Ethan pushed.

## Done (do not redo)

| Slice | Where | Live on `main.py`? |
|-------|--------|---------------------|
| J2 red-flag recommend | `backend/app/facilities/` | Yes (already was mounted) |
| Kenya catalog 52 rows | `backend/data/kenya-symptoms.json` | N/A |
| `POST /symptoms/map` | `backend/app/symptoms/` | **No** (handshake) |
| `POST /bookings` wait +1 | `backend/app/bookings/` | **No** (handshake) |
| KEPH / red-flag rules | `backend/app/triage/` | N/A (no HTTP) |

Decisions: [p2-decisions.md](p2-decisions.md) (hash embeddings, public map, no live KMHFR, rules on map/book from catalog).

## Do not touch

Hubs: `main.py`, `core/**`, `.env.example`, `pyproject.toml`, Alembic, `docs/api/README.md`, `docs/api/conventions.md`, `frontend/`, `backend/tests/`, wait **decrement**.

## Next (this is the next chat)

**P1 merge** when Ethan pushes: rebase `origin/dev` onto `upstream/dev`, confirm both routers are mounted, then P2 updates domain-chapter "mounted" snapshots. Handshake copy: [handshake-p1.md](handshake-p1.md). After mount, P1 re-exports OpenAPI.

Blocked until then (do not start unless the user waives):

1. **e5-small embeddings** (needs P1 pyproject extra). Until then map is exact-phrase hash (`careflow-hash-v1`).
2. **KMHFR ingest** (blocked on missing scorecards unless the user waives).
3. Catalog 52 → 100–200.

## Tests

Host often has no FastAPI. Catalog/hash unit checks can run with stdlib. Map/book pytest needs Compose `db` + backend venv:

`cd backend && DEMO_NOTIFY=1 DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow pytest app/facilities/tests app/symptoms/tests app/bookings/tests`

Map/book HTTP tests mount a **package-local** FastAPI app so they do not require `main.py`.

## Suggested skills (next agent)

`$engineering`, `$planning`, `$code-review` (backend) after a slice. Attach clash rules every write session.
