# P2 decisions and assumptions

| Field | Value |
|-------|-------|
| Document type | Working decisions (P2 Wave 1) |
| Version | 0.2 |
| Status | Draft (defaults locked after grill + work-with-assumptions) |
| Owner | Moses (P2) |
| Last updated | 2026-08-29 |
| Related documents | [p2-task-map.md](p2-task-map.md), [p2-wave1-plan.md](p2-wave1-plan.md), [team-issues.md](../plans/team-issues.md) |
| Prerequisites | [p2-task-map.md](p2-task-map.md) |
| Revision summary | Deferred: bookings increment is done unmounted |

## Assumptions

- Wave 1 ships **catalog + map + red-flag ranking** on the Nairobi seed. Live KMHFR is designed, not called. `[needs validation]` until Tester lands datasource scorecards or the team waives the kenya-pretriage hard rule.
- P3 Wave 1 can call `POST /symptoms/map` then `GET /facilities/recommend` with `keph_min` and `red_flag` from the map response. Bookings package exists unmounted; P3 book UI waits on P1 `include_router`.
- Feature tests under `backend/app/<pkg>/tests/` reuse `backend/tests/conftest.py` fixtures. Tester still owns `backend/tests/` smoke files; we do not edit them.
- Embedding quality in production needs `intfloat/multilingual-e5-small`. Until P1 merges the extra, tests insert fixture vectors; seed of real embeddings is gated. `[needs validation]` handshake timing.

## Decisions

| ID | Decision | Why |
|----|----------|-----|
| D-P2-01 | **No live KMHFR in Wave 1.** Keep J7 seed. Ingest job is a later phase after scorecards. | Hard rule in kenya-pretriage; scorecards are missing. |
| D-P2-02 | **Confidence floor = 0.55** cosine similarity (1 − distance). Below floor: empty `matches`, still 200. | Spec unnamed; 0.55 is a start for multilingual e5; tunable via Settings later (handshake). `[needs validation]` |
| D-P2-03 | **Query `red_flag` boolean, default false.** When true: `keph_level >= GREATEST(4, keph_min)`, **ORDER BY distance only**. | Matches schema § recommend shapes; keeps one route for P3. |
| D-P2-04 | **`POST /symptoms/map` is public in Wave 1** (Bearer ignored), same as recommend. Patient auth in Wave 2 with bookings. | P3 Firebase client may not be wired to this route on day one; map is not PII beyond a symptom string. |
| D-P2-05 | **Rules ride on the map response** (`keph_min`, `red_flag`). No `backend/app/triage/` until Wave 2. | Team-issues puts triage in Wave 2; P3 still needs a floor for recommend. |
| D-P2-06 | **P2 drafts a starter catalog** (~40–80 rows, not 200) in committed JSON: en + sw phrases, a few ki/luo/kln/kam, ICD-11 optional empty. Expand later. | Unblocks map; MoH KEPH as rules not embeddings. |
| D-P2-07 | **Embed at seed, search in SQL.** API request path does not load sentence-transformers. Optional extra for the seed job only. Tests use deterministic fixture vectors. | Avoids a heavy model on every `/symptoms/map`. Handshake P1 for the extra when we seed real vectors. |

## Deferred

- Patient auth on `POST /symptoms/map` (map stays public; D-P2-04).
- e5-small at seed (`careflow-hash-v1` until P1 pyproject extra).
- Live KMHFR sync and Esri QA.
- Raising catalog to 100–200 symptoms.
- Tuning 0.55 from labelled utterances.

**Done unmounted (not deferred):** `POST /bookings` wait increment. Lives in `backend/app/bookings/`. Not on `main.py` until P1. Decrement remains P4.

## Grill (closed)

You asked to grill, then pick defaults and start. The seven open questions in the task map are closed by D-P2-01 … D-P2-07 above. Contradict any row and we revise the plan before the next phase.
