# Draft non-functional requirements

| Field | Value |
|-------|-------|
| Document type | Non-functional requirements |
| Version | 0.1 |
| Status | Draft |
| Owner | camline |
| Last updated | 2026-08-28 |
| Related documents | [03-functional-requirements.md](03-functional-requirements.md), [05-open-questions.md](05-open-questions.md) |
| Prerequisites | [03-functional-requirements.md](03-functional-requirements.md) |
| Revision summary | Extracted quality attributes from plans; many numeric targets missing |

Previous: [03-functional-requirements.md](03-functional-requirements.md) · Next: [05-open-questions.md](05-open-questions.md)

## 1. How to read this

Same status rules as the FR list. Rows marked **Missing** have no number, SLA, or test in the repo. Those are the NFRs we still have to write, not invent.

Quality attributes below are grouped by concern. Stack and vendor names from the plan are **not** NFRs; they are design choices and stay out of this table except where a constraint is independent of vendor (for example "vendor keys never in the PWA").

## 2. Constraints that are already written

| ID | Category | Requirement | Source | Status |
|----|----------|-------------|--------|--------|
| NFR-GEO-01 | Geography | Kenya only: facility registry, counties, `+254` phones. Drop facilities with null coordinates | [product-spec.md](../plans/product-spec.md) | Proposed |
| NFR-I18N-01 | Language | UI, TTS, SMS, and calls in English and Kiswahili | [kenya-pretriage.md](../plans/kenya-pretriage.md) | Proposed |
| NFR-I18N-02 | Language | Symptom synonyms also for Gĩkũyũ, Dholuo, Kalenjin, Kikamba. Spoken Kikuyu/Luo/Kamba/Meru supported via STT/TTS fallback | Same | Proposed |
| NFR-A11Y-01 | Accessibility | Voice path is required for blind and low-vision care-seekers, not optional polish | J8 | Proposed |
| NFR-A11Y-02 | Accessibility | No microphone until explicit consent | J8 | Proposed |
| NFR-A11Y-03 | Accessibility | Visual path remains fully usable with keyboard and screen-reader labels when voice is off | J8 | Proposed |
| NFR-SEC-01 | Security | Protected API routes require a verified identity token. Role lives in our data, keyed by that identity | Plan + spec | Proposed |
| NFR-SEC-02 | Security | Hospital staff are isolated to one `facility_id` | J4, J5 | Proposed |
| NFR-SEC-03 | Security | Voice and notify vendor keys stay on the API. Never in the PWA | Plan | Proposed |
| NFR-SEC-04 | Security | Secrets via Phantom locally; never commit values | Spec, ONBOARDING | Proposed |
| NFR-SEC-05 | Security | Patients cannot read clinical notes | J6 | Proposed |
| NFR-REL-01 | Reliability | On STT/TTS/call timeout, 4xx/5xx, or empty transcript: switch provider once, then fail closed to text UI + SMS | Plan voice routing | Proposed |
| NFR-REL-02 | Reliability | Voice or telephony failure must not block booking | P5 acceptance | Proposed |
| NFR-REL-03 | Reliability | Facility registry may flake: operate from cache + committed seed | Plan assumptions | Proposed |
| NFR-SAFE-01 | Clinical safety | Product is not a diagnosis and not a medical device. Copy must say pretriage routing | Journeys | Proposed |
| NFR-SAFE-02 | Clinical safety | Red flags must not recommend a quieter distant Level 2 | J2 | Proposed |
| NFR-OPS-01 | Operations | Demo notify flag logs instead of sending SMS or placing live calls | J9 | Proposed |
| NFR-OPS-02 | Operations | Local run via containerised API + Postgres; HTTPS required for installed PWA in production | Plan | Proposed |
| NFR-OPS-03 | Operations | Polling is enough; real-time websockets are deferred | Deferred list | Proposed |
| NFR-CLI-01 | Compliance | Production DPA/DPIA is deferred | Deferred list | Proposed |

## 3. Quality attributes that are missing

These need numbers or explicit "unspecified for hackathon demo" before design.

| ID | Category | Gap | Why it blocks design |
|----|----------|-----|----------------------|
| NFR-PERF-01 | Performance | No latency target for recommend, symptom map, STT, or booking | Affects caching, sync vs async voice, hosting tier |
| NFR-PERF-02 | Performance | No page-weight or PWA budget | Affects installability on low-end Android |
| NFR-SCALE-01 | Scale | KMHFR size cited as ~17,357 facilities (Aug 2026) but no concurrent-user or booking-rate target | Affects ranking query and wait-count contention |
| NFR-AVAIL-01 | Availability | No uptime target; no stated behaviour if the API is down (offline PWA?) | Service worker is named; offline behaviour is not |
| NFR-DATA-01 | Data | No retention, deletion, or export rules for phone numbers, notes, photos, audio | Health-adjacent PII; DPA deferred but demo still stores phones |
| NFR-DATA-02 | Data | No photo/PII handling rules (who can download images, how long OCR text lives) | Notes feature |
| NFR-AUDIT-01 | Audit | No requirement to log who changed wait_count or marked arrived/no-show | Hospital trust and demo credibility |
| NFR-TEST-01 | Testability | Test command is still a placeholder. T owns J1–J9 E2E including "no mic without yes" and "J9 logged not live-dialled in CI" | Cannot gate merges yet |
| NFR-OBS-01 | Observability | No logging/metrics/tracing requirements beyond demo notify logs | Operations |
| NFR-A11Y-04 | Accessibility | No WCAG level, contrast, or language of UI chrome beyond en/sw strings | J8 names screen-reader labels only |
| NFR-NET-01 | Network | No stated behaviour on 2G / flaky mobile data except fail-closed voice | Kenya mobile context |
| NFR-I18N-03 | Language | No requirement for which language is default on first visit, or how last language is stored | Landing greeting |

## 4. What we will not treat as NFRs yet

These appear in the plan as **design decisions**. They stay out of the NFR list until you confirm the constraint independent of the vendor:

- Next.js, FastAPI, PostgreSQL, pgvector
- Firebase as identity provider
- Africa's Talking, ElevenLabs, Pawa AI, Twilio
- Render as host
- One six-person folder split

If you confirm "must run as an installable PWA on mid-range Kenyan Android" that is an NFR. "Must be Next.js" is not.

## 5. Suggested NFR bar for a hackathon demo `[Likely]`

Only if you want a temporary bar so we can proceed. Not confirmed:

- Recommend and book respond in a few seconds on the demo network
- Seed set is enough; full KMHFR sync is not required for demo day
- CI never places a live phone call or SMS to a real number
- No production uptime claim
- PII in demo accounts is synthetic or volunteer-only
