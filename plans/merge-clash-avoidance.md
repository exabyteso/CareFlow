# Merge-clash avoidance — parallel people and subagent teams

How six orchestrators (P1–P5, T) and their Cursor subagents stay out of each other's diffs. **Issue bodies:** [team-issues.md](team-issues.md). **Epic:** [kenya-pretriage.md](kenya-pretriage.md). **Workflow:** [docs/agent-and-subagent-workflow.md](../docs/agent-and-subagent-workflow.md).

Attach this file in every agent session that writes code.

---

## Rule

No two agents (people or subagents) **edit the same file in the same wave**. Feature folders are disjoint. **Hub files** have a single writer. Cross-cutting behaviour is a **handshake**, not a drive-by edit.

Each person is a **parent orchestrator**. Subagents get a brief with **Owns / Delivers / Does not touch / handshake** — never “implement the whole issue.”

---

## Wait for baseline

Do not start P1–P5 / T feature work until the Wave 0 baseline is merged (`GET /health`, `GET /me`, seed `GET /facilities/recommend`, PWA shells, Alembic `0001`, Compose, CI). **Do not recreate it.**

Already landed (treat as done):

| Surface | Where |
|---------|--------|
| Compose + pgvector Postgres + app role | `docker-compose.yml`, `backend/docker/init/` |
| FastAPI core, Dockerfile, `GET /health` | `backend/app/core/`, `backend/app/main.py`, `backend/Dockerfile` |
| Alembic `0001` from product-schema | `backend/alembic/` |
| Firebase `GET /me` + demo seeds | `backend/app/auth/` |
| Nairobi seed + recommend | `backend/app/facilities/` |
| PWA shells `/`, `/patient`, `/hospital` | `frontend/app/` |
| Env names, CI, Render blueprint | `.env.example`, `.github/workflows/ci.yml` |
| Smoke tests | `backend/tests/` |
| API chapters health / me / facilities | `docs/api/` |

---

## Wave gate (who may write when)

| Wave | Who writes | Who waits |
|------|------------|-----------|
| **0** | Baseline (done / merging) | Everyone else |
| **1** | **P1** hub steward, **P2** KMHFR + symptom catalog, **P3** landing + care-seeker UI (text path) | P4, P5, T E2E. P3 does **not** create `backend/app/voice/`. P3 does **not** ship book until P2 `POST /bookings` exists. |
| **2** | **P2** triage + bookings, **P3** book UI, **P4** desk, **P5** notes/SMS/voice, **T** E2E + fixtures | — |
| **3** | P1 Render polish, T full J1–J9 | — |

Starting Wave 2 folders on day one forces invented APIs and later fights with P1/P2.

---

## Hub files (one writer)

Everyone **imports** these. Only the owner **edits** them. Need a change? Use **Handshake** below.

| Hub | Owner | Others |
|-----|--------|--------|
| `backend/app/main.py` | **P1** | Export `router` from your package. Do not `include_router` yourself. |
| `backend/app/core/**` including `config.py` | **P1** | Import `get_settings`, `get_db`, `set_rls_gucs`. Do not add settings fields here. |
| `.env.example` | **P1** | Name the env var in the handshake; do not append locally. |
| `backend/pyproject.toml` | **P1** | Request the dependency; do not add it. |
| `frontend/package.json` + lockfile | **P1** | Same — Firebase, Playwright, etc. |
| `backend/alembic/**` | **P1** | Do not add `0002`. P2 embedding-dim change is a P1 revision from P2’s SQL snippet. |
| `.github/workflows/ci.yml`, Render blueprint | **P1** | Request secrets/steps; do not edit CI. |
| `docs/api/README.md` route map, `docs/api/conventions.md` | **P1** | You own **your** domain chapter only (`docs/api/symptoms.md`, `bookings.md`, `hospital.md`, `notes.md`, `voice.md`, `notify.md`). |
| `frontend/app/layout.tsx`, `globals.css`, `manifest.ts`, `next.config.ts`, `public/sw.js` | **P1** | Touch only if PWA install is broken (P1). Feature CSS stays in your route tree. |
| `frontend/lib/auth.ts` (create if missing) | **P3** | P4/P5 **import** Firebase client + token helper. Do not fork a second client. |
| `frontend/lib/api/client.ts` (fetch wrapper) | **P3** | P4/P5 import it. Do not add hospital/notes methods here. |
| `frontend/components/app-shell.tsx` | **P3** | Layout chrome only via handshake to P3. Your pages compose it. |

`backend/app/auth/deps.py` stays P1. Check `user.role` in **your** router. Handshake P1 only if you need a new shared dependency (`require_staff`).

---

## Handshake (how to change a hub)

Do **not** edit the hub “just this once.” Send P1 (or P3 for auth/API client) a note with:

1. **File**
2. **One-line change** (e.g. `include_router(notes_router)`, `PAWA_AI_API_KEY` on Settings, `sentence-transformers` in pyproject)
3. **Why** (journey or acceptance line)

P1 merges hub PRs; everyone else rebases. Same pattern the baseline used: workers did not touch `main.py`.

---

## Logic contracts (disjoint files, one behaviour)

Git-clean merges can still double-implement the product. Follow these.

### Wait count and bookings

- **P2** `POST /bookings` **increments** `wait_count` in the same transaction as the instant booking (schema contract).
- **P4** arrived / no-show **decrements** `wait_count`. **P4** `PATCH /hospital/wait-count` is the staff override (desk-typed ranking input, not HMIS).
- Neither reimplements the other’s transaction. Do not increment in hospital routes or decrement in `bookings/`.

### Voice

- **P5** owns `backend/app/voice/` (`POST /voice/stt`, `POST /voice/tts`, ElevenLabs → Pawa cascade).
- **P3** calls those routes from the PWA. **P3 never** puts vendor keys in the browser and **never** creates `backend/app/voice/`.
- Wave 1: care-seeker **text** path works; speak-path may no-op or mock **in the frontend only** until P5 lands.

### Hospital notes URL

- **P4** owns `frontend/app/hospital/**` except `notes/`, including a **link** to `/hospital/notes`.
- **P5** owns `frontend/app/hospital/notes/**` only. Do not edit `hospital/page.tsx` or a hospital `layout.tsx`.

### API clients (frontend)

| File | Owner | Contains |
|------|--------|----------|
| `frontend/lib/api/client.ts` | P3 | Base URL, Bearer, error envelope |
| `frontend/lib/api/patient.ts` | P3 | `/me`, map-symptom, recommend, book, `/voice/*` calls |
| `frontend/lib/api/hospital.ts` | P4 | queue, wait-count, arrived, no-show |
| `frontend/lib/api/notes.ts` | P5 | notes create |

Do not grow a single `api.ts` that P3, P4, and P5 all edit.

### Tests

| Tree | Owner |
|------|--------|
| `backend/app/<package>/tests/` | That person (P2 facilities/symptoms/bookings, P4 hospital, P5 notes/notify/voice, P1 auth if needed) |
| `backend/tests/` | **T** — cross-cutting smoke only (extend baseline; do not rewrite P2 ranking tests into a second copy) |
| `frontend/e2e/` | **T** |
| `docs/testing-reference.md` | **T** (command rows); P1 if CI must change |

Feature subagents **must not** add files under `backend/tests/` or `frontend/e2e/`. T **must not** edit production feature folders.

---

## Subagent splits (inside one person)

Parents split workers by **folder**, not by “the whole issue.” Example partitions:

| Person | Parallel subagents (disjoint) |
|--------|-------------------------------|
| **P1** | Sequential on hubs. Never two agents on `main.py` / `config.py` / `pyproject.toml`. Docker vs auth helpers vs a **single** hub-wiring pass. |
| **P2** | `facilities/` vs `symptoms/` in Wave 1; Wave 2 `triage/` vs `bookings/` |
| **P3** | `app/page.tsx` (landing) vs `app/patient/**` vs `lib/auth.ts` + `lib/api/client.ts` + `lib/api/patient.ts` (one agent on `lib/`) |
| **P4** | `backend/app/hospital/` vs `frontend/app/hospital/**` (except notes) vs `frontend/lib/api/hospital.ts` |
| **P5** | `notes/` vs `notify/` vs `voice/` vs `frontend/app/hospital/notes/**` + `lib/api/notes.ts` — **none** of these agents edit `config.py` |
| **T** | pytest smoke vs Playwright vs research scorecards |

Every subagent prompt includes **Does not touch: hubs listed in merge-clash-avoidance.md**.

---

## Merge hygiene

- Small PRs, rebase on `main` before push.
- If two people need the same hub change, **one PR from P1**, not two.
- After a hub merge, others `git pull --rebase` before continuing.
- Do not invent a second facility schema, diagnosis engine, or `/v1` prefix.

---

## Paste into every subagent brief

```
Attach: plans/merge-clash-avoidance.md, plans/team-issues.md (your person),
plans/user-journeys.md, plans/product-spec.md, docs/api/AGENTS.md

Owns: (paths)
Delivers: (files / behaviour)
Does not touch: hub files, other persons’ trees, backend/tests/, frontend/e2e/
Handshake: if you need main.py / config / env / pyproject / package.json / alembic / CI,
stop and list the one-line change for P1 — do not edit those files.
```
