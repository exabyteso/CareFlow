# Team issues — P1–P5 and T

Source of truth if GitHub issues cannot be created. After push, prefer `gh issue create` from these bodies. Labels: `person-p1` … `person-t`, `wave-1` / `wave-2`.

| Role | Assignee |
|------|----------|
| P1 — Platform steward | Ethan |
| P2 — Facilities, KMHFR, symptoms | Moses |
| P3 — Care-seeker PWA | Andrew |
| P4 — Hospital desk PWA | Joseph |
| P5 — Notes, SMS, voice | Brian |
| T — Tester | Kalungu |

**Clash rules (required):** [merge-clash-avoidance.md](merge-clash-avoidance.md) — hub owners, handshake, wait_count/voice/tests, wave gate. Attach it in every agent session.

Also attach [user-journeys.md](user-journeys.md), [kenya-pretriage.md](kenya-pretriage.md), [product-spec.md](product-spec.md), [product-schema.md](product-schema.md), [docs/api/](../docs/api/). Epic journeys J1–J9.

**Handover:** start only after Wave 0 baseline is on `main`. Do not rebuild Compose, `0001`, `/health`, `/me`, seed recommend, or PWA shells.

---

## P1 — Platform steward (hubs) — Ethan

**Title:** `[P1] Hub steward: routers, config, deps, Alembic, Render`

**Wave:** 1 (ongoing steward through 2–3). Baseline already landed auth, Docker, `/me`, CI stubs.

**Owns (write):** `backend/app/main.py`, `backend/app/core/**`, `backend/app/auth/**`, `backend/Dockerfile`, `docker-compose.yml`, `backend/alembic/**`, `backend/pyproject.toml`, `.env.example`, `.github/workflows/ci.yml`, Render blueprint, `docs/api/README.md` + `conventions.md`, `frontend/package.json` + lockfile, `frontend/app/layout.tsx` / `globals.css` / `manifest.ts` / `next.config.ts` / `public/sw.js`.

**Does not touch:** `backend/app/facilities/` (except include router), `symptoms/`, `triage/`, `bookings/`, `hospital/`, `notes/`, `notify/`, `voice/`, `frontend/app/patient/**`, `frontend/app/hospital/**`.

**Handshake in:** include_router lines; Settings / `.env.example` names; Python and npm dependencies; Alembic `0002+` from P2 SQL; CI secrets/steps; `docs/api/` route-map rows.

**Journeys:** unblocks J1–J6 (sign-in). Not symptom UI.

**Acceptance:** Others can land packages without editing hubs; ID token `/me` still works; Compose + `/health`; secrets not committed; requested env names and deps merged promptly.

**Subagents:** Sequential on hubs — never two agents on `main.py` or `config.py`. Optional: Docker/Render polish vs auth helper (`require_staff`) vs one wiring pass.

**Parent prompt (paste):**

```
You are P1 (platform steward). Attach plans/merge-clash-avoidance.md and plans/team-issues.md §P1.
Do not recreate baseline. You are the only writer of hub files. Merge handshake requests
(include_router, Settings fields, pyproject, package.json, alembic 0002, CI, docs/api README rows).
Does not touch feature folders. Merge into main.
```

---

## P2 — Facilities, KMHFR, symptom catalog, later bookings — Moses

**Title:** `[P2] KMHFR ingest, ranking, Kenya symptom catalog + pgvector; Wave 2 bookings`

**Wave:** 1 catalog + ranking; **2** `triage/` + `bookings/` (wait increment). Seed recommend already exists — extend, do not replace the J7 seed path until KMHFR is live.

**Owns:** `backend/app/facilities/`, `backend/app/symptoms/`. Wave 2: `backend/app/triage/`, `backend/app/bookings/`. Unit tests under those packages. Domain chapters `docs/api/facilities.md` (extend), `docs/api/symptoms.md`, Wave 2 `docs/api/bookings.md`.

**Does not touch:** Esri as SoT, frontend, notes, notify, ElevenLabs/Pawa, hubs, `backend/tests/`, `frontend/e2e/`. No wait **decrement** (P4).

**Handshake to P1:** `include_router` for symptoms/triage/bookings; embedding extra on `pyproject.toml`; optional Alembic `0002` if embedding dim changes ([product-schema.md](product-schema.md) §4); route-map rows.

**Journeys:** J1 steps 4–6, J2, J7, J8 mapping.

**Acceptance:** Kenya-only facilities; recommend wait-then-distance; utterance `en`/`sw`/synonym langs maps to `symptom_id` above a confidence floor; rules pick KEPH; `POST /bookings` increments `wait_count` (Wave 2).

Read [research/big-picture/kenya-pretriage-landscape/deliverables/datasource-scorecard.md](../research/big-picture/kenya-pretriage-landscape/deliverables/datasource-scorecard.md) and `symptom-ontology-scorecard.md` before ingest.

**Subagents:** Wave 1 `facilities/` vs `symptoms/` (parallel). Wave 2 `triage/` vs `bookings/` after catalog exists.

**Parent prompt (paste):**

```
You are P2. Attach plans/merge-clash-avoidance.md and plans/team-issues.md §P2.
Wave 1: KMHFR + symptoms/pgvector + map API in backend/app/facilities and symptoms.
Wave 2 only later: triage + POST /bookings (increment wait_count). Do not edit hubs,
frontend, notify, or backend/tests. Handshake P1 for routers/deps/alembic.
Read datasource-scorecard and symptom-ontology-scorecard before ingest.
```

---

## P3 — Care-seeker PWA — Andrew

**Title:** `[P3] Patient PWA: voice-consent landing, speak/text symptoms, book`

**Wave:** 1 landing + Firebase client + text symptom → recommend; **2** book UI after P2 `POST /bookings`. Voice **backend** is P5 — do not create `backend/app/voice/`. Wave 1 speak-path may mock STT **in the frontend only**.

**Owns:** `frontend/app/page.tsx` (landing `/`, J8 consent **before** other chrome), `frontend/app/patient/**`, `frontend/lib/auth.ts`, `frontend/lib/api/client.ts`, `frontend/lib/api/patient.ts`, `frontend/components/app-shell.tsx`. In-app speech via **`POST /voice/stt` and `/voice/tts`** once P5 exists (never ElevenLabs/Pawa from the browser).

**Does not touch:** `frontend/app/hospital/**`, backend ranking/bookings/voice modules, outbound phone calls (P5), hubs except handshake npm `firebase` (P1 edits `package.json`).

**Handshake to P1:** `firebase` (and related) in `frontend/package.json`. **P4/P5 import** your auth + fetch client — keep those files stable.

**Journeys:** J1, J2, J7, J8.

**Acceptance:** Landing greets and asks to activate voice **before** other chrome; no mic until consent; text (and later spoken) symptom path books a facility; en + sw UI strings.

**Subagents:** landing vs `patient/**` vs one agent on `frontend/lib/**` (do not parallel-edit `auth.ts` / `client.ts`).

**Parent prompt (paste):**

```
You are P3. Attach plans/merge-clash-avoidance.md and plans/team-issues.md §P3.
Owns patient routes, landing /, Firebase client, api/client.ts + api/patient.ts.
No mic until consent. Do not create backend/app/voice. Do not edit hospital/** or hubs.
Wave 1: text path + consent; Wave 2: book after P2 bookings exist.
P4/P5 will import your auth client — do not fork it.
```

---

## P4 — Hospital desk PWA — Joseph

**Title:** `[P4] Hospital PWA: wait count, mark met / no-show`

**Wave:** **2** (after P1 auth + P2 bookings). Shell `/hospital` already exists.

**Owns:** `backend/app/hospital/`, `frontend/app/hospital/**` **except** `notes/`, `frontend/lib/api/hospital.ts`. Add a **link** to `/hospital/notes` on the desk (P5 builds the page). Unit tests under `backend/app/hospital/tests/`. Chapter `docs/api/hospital.md`.

**Does not touch:** triage rules, SMS send, notes OCR, `frontend/app/patient/**`, `frontend/app/hospital/notes/**`, hubs, `backend/tests/`. Do not **increment** wait on book (P2). Import P3 `lib/auth.ts` and `lib/api/client.ts`.

**Handshake to P1:** `include_router` hospital; `docs/api` README row. Handshake to P3 only if the shared client cannot attach Bearer.

**Journeys:** J4, J5; status change triggers J3 (P5 sends SMS).

**Acceptance:** Staff see only their facility; update wait; mark met / did not come; wait count decrements on terminal status as per spec.

**Subagents:** `backend/app/hospital/` vs `frontend/app/hospital/**` vs `lib/api/hospital.ts`.

**Parent prompt (paste):**

```
You are P4. Attach plans/merge-clash-avoidance.md and plans/team-issues.md §P4.
Wave 2 only. Owns backend/app/hospital and frontend/app/hospital except notes/.
Decrement wait_count on arrived/no-show; PATCH wait-count is staff override.
Link to /hospital/notes but do not build notes pages. Import P3 auth/client.
Do not edit hubs, patient/**, notes/**, or backend/tests.
```

---

## P5 — Notes, SMS, ElevenLabs + Pawa voice — Brian

**Title:** `[P5] Notes + SMS + ElevenLabs calls with Pawa AI fallback`

**Wave:** **2** (after P1 env steward + P2 bookings for notify targets).

**Owns:** `backend/app/notes/`, `backend/app/notify/`, `backend/app/voice/` (ElevenLabs first; **[Pawa AI](https://docs.pawa-ai.com/)** STT/TTS fallback), `frontend/app/hospital/notes/**`, `frontend/lib/api/notes.ts`. Unit tests under those backend packages. Chapters `docs/api/notes.md`, `voice.md`, `notify.md`.

**Does not touch:** ranking, wait UI, `frontend/app/page.tsx`, `frontend/app/hospital/page.tsx` (P4 owns the desk link), hubs (`config.py` / `.env.example` are handshake). Fail closed to text + SMS; never block booking.

**Handshake to P1:** `AFRICAS_TALKING_*`, `ELEVENLABS_*`, `TWILIO_*`, `PAWA_AI_API_KEY`, `DEMO_NOTIFY` already named — add any **new** Settings fields + pyproject extras (SDKs); `include_router` for notes/notify/voice; README route-map rows.

**Journeys:** J1 SMS, J3, J6, J8 STT/TTS backend, J9.

**Acceptance:** Demo flag logs SMS/calls if keys missing; cascade documented (en/sw → ElevenLabs, Kenyan local langs or ElevenLabs error → Pawa); notes persist text + transcript + image URLs + OCR; patients cannot read notes.

**Subagents:** `notes/` vs `notify/` vs `voice/` vs `frontend/app/hospital/notes/**` — **no** agent edits `config.py` or `main.py`.

**Parent prompt (paste):**

```
You are P5. Attach plans/merge-clash-avoidance.md and plans/team-issues.md §P5.
Wave 2. Owns notes, notify, backend/app/voice (ElevenLabs then Pawa), hospital/notes UI.
Do not edit config.py, main.py, hospital/page.tsx, ranking, or patient landing.
Handshake P1 for routers and any new deps/settings. DEMO_NOTIFY=1 must not live-dial.
P3 will call POST /voice/stt and /tts — you own those handlers.
```

---

## T — Tester — Kalungu

**Title:** `[T] Test plan, fixtures, pytest smoke + Playwright J1–J9`

**Wave:** Plan + scorecards anytime; **E2E and `backend/tests/` expansion in Wave 2–3** after APIs exist. Baseline smoke tests already live — extend, do not duplicate feature-package tests.

**Owns:** `backend/tests/` (cross-cutting smoke only), `frontend/e2e/`, fixtures, [docs/testing-reference.md](../docs/testing-reference.md) command rows. Symptom-ontology scorecard expansion; competitor matrix; research prompt archival ([research/AGENTS.md](../research/AGENTS.md)).

**Does not touch:** production feature folders (`backend/app/facilities/` etc.). Do not rewrite P2/P4/P5 unit tests that live under `backend/app/<pkg>/tests/`.

**Handshake to P1:** Playwright (or extra pytest plugins) in `frontend/package.json` / `pyproject.toml`; CI E2E job when ready. Never live-dial (`DEMO_NOTIFY=1`).

**Journeys:** J1–J9 including voice-consent (no mic without yes) and reminder-call demo log.

**Acceptance:** Documented test command; smoke J1, J5, J8 consent, J2; J3 no-show; J9 logged not live-dialled in CI.

**Subagents:** pytest smoke vs Playwright vs research artifacts (disjoint paths).

**Parent prompt (paste):**

```
You are T (tester). Attach plans/merge-clash-avoidance.md and plans/team-issues.md §T.
Owns backend/tests (smoke only) and frontend/e2e. Do not edit production feature folders.
Feature unit tests stay in backend/app/<pkg>/tests/. DEMO_NOTIFY=1; J9 not live-dialled in CI.
Handshake P1 for Playwright/CI. Expand scorecards per research/AGENTS.md; do not ingest research prompts.
```
