# Current repo state

| Field | Value |
|-------|-------|
| Document type | Repo inventory |
| Version | 0.2 |
| Status | Draft |
| Owner | camline |
| Last updated | 2026-08-29 |
| Related documents | [01-problem.md](01-problem.md), [03-functional-requirements.md](03-functional-requirements.md) |
| Prerequisites | [01-problem.md](01-problem.md) |
| Revision summary | Wave 3 inventory: FastAPI + PWA shells exist; D-001 locked; `/v1` tension resolved |

Previous: [01-problem.md](01-problem.md) · Next: [03-functional-requirements.md](03-functional-requirements.md)

## 1. One-line status

CareFlow is a **specified hackathon product with a local runnable slice**. Compose runs PostgreSQL 16 + FastAPI; the Next.js 15 PWA shells are on the host. Shipped HTTP: `GET /health`, `GET /me`, `GET /facilities/recommend` (Nairobi seed, no live KMHFR). `[Verified]`

## 2. What exists

| Path | What it actually contains |
|------|---------------------------|
| [README.md](../README.md) | Product one-liner; directory map; local Compose + PWA, not a deployed service |
| [plans/kenya-pretriage.md](../plans/kenya-pretriage.md) | Feature plan, stack sketch, 6-person split, demo script. Marked locked for hackathon MVP |
| [plans/product-spec.md](../plans/product-spec.md) | Domain objects, PWA routes, API stubs, seed and env names |
| [plans/user-journeys.md](../plans/user-journeys.md) | J1–J9 actors and steps |
| [plans/team-issues.md](../plans/team-issues.md) | P1–P5 and T ownership |
| `backend/` | FastAPI: health, Firebase `/me` (demo UIDs only), J7 `/facilities/recommend`; Alembic `0001`; Nairobi seed JSON |
| `frontend/` | Next.js 15 PWA: `/` role picker (no mic), `/patient` care-seeker + 999, `/hospital` desk this-facility-only; online-only SW |
| `research/` | Scaffolding plus **D-001** in [research/decision-log.md](../research/decision-log.md) (PostgreSQL + pgvector locked) |
| `docs/api/` | Conventions (no `/v1`), route map, health / me / facilities (J7) chapters |
| `.env.example` | Phantom template: `DATABASE_*`, `FRONTEND_ORIGIN`, `DEMO_NOTIFY`, Firebase, vendor keys |

## 3. Contradictions to resolve before design

These are not nits. They change what we are allowed to lock.

| Tension | Where | Why it matters |
|---------|-------|----------------|
| KMHFR is called the facility source of truth | [plans/kenya-pretriage.md](../plans/kenya-pretriage.md) | Recommend still loads **committed Nairobi seed** only. Decision log has **D-001** (Postgres) but **no facility SoT row**. Do not pretend live KMHFR is locked. |
| Cited research files do not exist | Plan links `research/big-picture/kenya-pretriage-landscape/deliverables/datasource-scorecard.md` and `symptom-ontology-scorecard.md` | Those paths are absent. Competitive and ontology claims are currently `[Unverified]` |
| Six-person split vs this session | [plans/team-issues.md](../plans/team-issues.md) | Ownership assumes P1–P5 + T. Unclear if that team still exists |
| Stack named in the plan vs older READMEs | [plans/kenya-pretriage.md](../plans/kenya-pretriage.md) | **Resolved for local run:** Next.js 15 + FastAPI + Postgres 16 + pgvector match D-001 and Compose. Remaining drift is vendor/P5 surfaces not wired. |
| API prefix | Product spec vs old `docs/api/` stubs | **Resolved:** no `/v1`. Paths are `/health`, `/me`, `/facilities/recommend`. [docs/api/conventions.md](api/conventions.md) rewritten. |
| "Locked for hackathon MVP" vs research log | Plan vs [research/decision-log.md](../research/decision-log.md) | **Partially resolved:** D-001 (PostgreSQL + pgvector) is recorded. Facility SoT / KMHFR is still not a decision-log row. |

## 4. Hard rule already in the plan

Do not build live `backend/app/facilities/` sync until:

1. The datasource scorecard exists, and
2. [research/decision-log.md](../research/decision-log.md) locks the source of truth

Until then, first boot recommends from committed seed / cache. `[Verified]`

That research has not been started in this repo. This pass used seed only; there is **no** new SoT row. `[Verified]`

## 5. What "done" looks like in the plans (not yet our session goal)

The plan sequences:

- Wave 0: plans, journeys, issues, research scorecards, then Docker `/health`, PWA shells, seed recommend stub
- Wave 1: auth, KMHFR + catalog, patient/voice
- Wave 2: rules/bookings, book UI, hospital desk, notes/SMS/calls, tests
- Wave 3: Render + E2E for J1–J9

Local Compose + `/health` + `/me` + seed recommend + PWA shells have landed. Scorecards, live KMHFR, bookings, voice, and Render E2E have not. This inventory file does not change FR/NFR drafts.

## 6. Implications for requirements work

1. Treat the plans as a **candidate product definition**, not as a finished architecture.
2. Extract FRs and NFRs from journeys first. Stack, vendors, and module layout wait — except D-001 (Postgres + pgvector) and the local FastAPI/PWA slice already in tree.
3. Anything that depends on missing research (KMHFR vs Esri, symptom ontologies, competitor whitespace) stays `[Unverified]` until we either do that research or you accept it as an assumption.
