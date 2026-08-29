# Open questions

| Field | Value |
|-------|-------|
| Document type | Decision log (working) |
| Version | 0.3 |
| Status | Draft |
| Owner | camline |
| Last updated | 2026-08-28 |
| Related documents | [03-functional-requirements.md](03-functional-requirements.md), [04-non-functional-requirements.md](04-non-functional-requirements.md) |
| Prerequisites | [01-problem.md](01-problem.md) through [04-non-functional-requirements.md](04-non-functional-requirements.md) |
| Revision summary | Full Grill me Round 1 written here; notes live in `docs/` (index: [camlinedev.md](camlinedev.md)) |

Previous: [04-non-functional-requirements.md](04-non-functional-requirements.md)

## 1. Stance

Path: **Grill me**. Design and modelling stay parked until the frontier is empty and the team confirms shared understanding.

Work the tree in rounds. Round 1 is parent decisions (one per question type). Round 2 stays blocked until Round 1 has answers.

Reply with a letter per question, or "all recommended".

## 2. Decisions so far

| Date | Decision | Source |
|------|----------|--------|
| 2026-08-28 | No design or domain model until FRs and NFRs are locked | Session |
| 2026-08-28 | Path is Grill me, not Work with assumptions | Session |
| 2026-08-28 | Delivery is a **team**, not solo + agents | Session |
| 2026-08-28 | Working notes live in committed `camlinedev/` (team will push). Still not a replacement for `plans/` until the grill closes | Session |
| 2026-08-29 | Working notes flattened from `docs/camlinedev/` into `docs/` (index [camlinedev.md](camlinedev.md)) so they share the docs tree without a second README | Session |

## 3. Grill me

Facts already taken from the repo (not asked): empty `backend/` and `frontend/`; empty research indexes; J1–J9 written; six-person split written as P1–P5 + T; stack named in the plan but not locked in AGENTS.md; live KMHFR sync blocked until a missing scorecard and a decision-log row.

### 3.1 Round 1 (open): parent questions, every type

Child topics waiting on this round: wait_count meaning, weak symptom match, family booking, staff provisioning, default language, GPS-denied behaviour, `/v1` prefix, stack/vendors.

#### Q1. Goal: what the team ships

What is "done" for this team?

- **A.** Pitch-day demo of the pretriage loop (judges, seeded data)
- **B.** Closed pilot with real volunteer care-seekers and one real hospital desk
- **C.** Public Kenya product

Recommended: **A.** The plans already describe a pitch script. **B** and **C** pull in DPA, real KMHFR, and live telephony that the repo has not earned yet.

#### Q2. Goal: whose problem

Is the agreed job still "wrong KEPH level + long wait, before the hospital door", or is someone on the team actually trying to build diagnosis, SHA, teleconsult, or hospital HMIS?

- **A.** Pretriage routing only (as in `plans/`)
- **B.** Different job (name it)

Recommended: **A.** If the team is split across jobs, stop and realign before any FR is locked.

#### Q3. Scope: journeys this pass

Treat J1–J9 as the Must list for this pass, or cut?

- **A.** All of J1–J9
- **B.** Cut list (name the J-ids)

Recommended: **A** for a pitch that matches the written demo. If the deadline is tight, the first cut is **J6 notes** and **J9 live call** (keep SMS log). Do not cut J2 red flag or J8 consent.

#### Q4. Scope: non-goals

Confirm the Won’t list: SHA/AfyaKE, live HMIS queues, native apps, ambulance, pharmacy, diagnosis engine, inbound IVR, all Kenyan languages.

- **A.** Confirm as Won’t
- **B.** Pull something back in (name it)

Recommended: **A.**

#### Q5. Constraints: deadline

When must a stranger be able to walk the demo loop?

- **A.** You will name a date
- **B.** No date; lock requirements first, then schedule

Recommended: **B** until a date exists. A date changes Must vs Could immediately.

#### Q6. Constraints: team shape

How many people, and is the written split (P1 platform, P2 facilities/symptoms, P3 patient PWA, P4 hospital, P5 notes/notify/voice, T tests) still the team?

- **A.** Yes, six roles as written
- **B.** Different headcount or roles (list them)

Recommended: **A** if that is still the hackathon team. If not, **B** with names/roles. Requirements do not change with folder ownership; sequencing does.

#### Q7. Constraints: paid APIs

For this pass, are Africa’s Talking, ElevenLabs, Pawa, Twilio, Firebase **live paid** or **demo-log / free-tier**?

- **A.** Demo-log acceptable; live send is optional if keys exist
- **B.** Demo day must send a real SMS and/or place a real call
- **C.** Budget is approved for production-like usage

Recommended: **A.** Fail closed to console logs. **B** is a demo-day extra, not a requirement to start.

#### Q8. Users: who we optimise for if we cut

If the team can only nail one side of the PWA, who wins?

- **A.** Care-seeker (symptoms → KEPH → book)
- **B.** Hospital desk (wait count, arrived/no-show)
- **C.** Both are equally Must (no cut)

Recommended: **C** for the product loop. If Q5 is a brutal date, **A** first, then a thin **B** (wait count + mark arrived). Ranking is a lie without a wait number.

#### Q9. Users: who locks FRs

Who on the team has veto if P2 and P3 disagree about symptom copy or KEPH rules?

- **A.** You (camline)
- **B.** Named product owner
- **C.** Consensus of the whole team

Recommended: **A** or **B**, one person. **C** will stall the grill.

#### Q10. Channel (architecture as constraint, not stack)

How must a care-seeker reach this in **this pass**?

- **A.** Smartphone PWA only (browser or installed)
- **B.** Also WhatsApp or USSD / feature phone
- **C.** Hospital desk may be desktop; care-seeker must be mobile web

Recommended: **A** plus **C** as a softening: patient is mobile-first PWA; hospital may be a laptop at the desk. **B** is a different product; it is out unless you override.

#### Q11. Data: facilities this pass

What facility data is required to call the loop done?

- **A.** Committed Nairobi seed only
- **B.** Live KMHFR sync (blocked today: scorecards and decision log are empty)
- **C.** Seed for demo, KMHFR research started in parallel but not on the critical path

Recommended: **C.** Do not make live sync a Must until research exists. Seed is enough to prove ranking.

#### Q12. UX: voice and low vision

Is J8 (spoken greeting, no mic until consent, full book-by-voice) Must for this pass?

- **A.** Must, including book-by-voice
- **B.** Must consent + greeting; spoken booking can be Should
- **C.** Visual-only demo is acceptable

Recommended: **B.** Consent is a safety/privacy Must. Full voice booking is the a11y bar in the journeys; it is also the riskiest build. Do not drop consent.

#### Q13. External services: failure

When STT, TTS, SMS, or call vendors fail, what must still work?

- **A.** Text UI + booking always; SMS/call/voice degrade
- **B.** Booking blocked until voice works
- **C.** Hospital notes blocked until OCR/voice-note vendor works

Recommended: **A.** This is already in the plans. Confirm it as an NFR, not a vendor choice.

#### Q14. Testing: merge bar

What must be true before a teammate merges to `main`?

- **A.** Automated tests for that person’s journeys, plus CI never live-dials or SMS-blasts
- **B.** Manual demo on a laptop is enough for the hackathon
- **C.** Full J1–J9 E2E on every PR

Recommended: **A.** **C** is the T-role end state, not the first merge gate. **B** will break the six-person split.

#### Q15. Rollout: who may use it

Who is allowed to create a booking in this pass?

- **A.** Seeded demo accounts only (known phones, known hospital logins)
- **B.** Any Google/email signup
- **C.** Public Kenyan users on a deployed URL

Recommended: **A.** **C** is a production rollout. **B** without **A** risks dialling strangers if notify is live.

#### Q16. Alternatives: why this and not a smaller wedge

If the team had half the time, which single proof is the product?

- **A.** Symptom text → KEPH level → ranked facilities (the routing claim)
- **B.** Hospital wait number that changes ranking
- **C.** Voice in Kiswahili / local languages
- **D.** SMS reminder

Recommended: **A.** Wait ranking without correct KEPH is a hospital finder. Voice without **A** is a gadget. SMS without **A** is an appointment app.

#### Q17. Clinical safety copy

"Not a diagnosis / not a medical device / call 999": what is that?

- **A.** Hard requirement for every care-seeker path
- **B.** Hackathon disclaimer only, can bury
- **C.** We intend medical-device claims later

Recommended: **A.** **C** is out of scope and a different compliance regime.

#### Q18. Handoff: plans vs this folder

After the grill, where do locked FRs/NFRs live, and is the product still named CareFlow?

- **A.** Lock in `docs/` ([camlinedev.md](camlinedev.md) and numbered notes); product name stays CareFlow; promote to `plans/` only when the team asks
- **B.** Lock by updating `plans/` in git as the team source of truth
- **C.** Rename the product

Recommended: **A** for the working notes (now in `docs/`). Do not rename. Promote into `plans/` when the grill closes if the team wants `plans/` to stay the spec root.

Status: **partially answered**. Notes live in `docs/` with index [camlinedev.md](camlinedev.md). Product rename is still open unless you confirm CareFlow.

### 3.2 Round 2 (blocked)

Unblocked only after Round 1 answers.

- Wait_count: staff-typed, derived from open bookings, or override of a derived count
- Weak symptom match behaviour
- Family booking identity
- Staff provisioning
- Offline cache contents
- Photo/note retention
- API prefix and auth-on-recommend
- Whether the six-person folder split stays
