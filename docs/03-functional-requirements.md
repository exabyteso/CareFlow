# Draft functional requirements

| Field | Value |
|-------|-------|
| Document type | Functional requirements |
| Version | 0.1 |
| Status | Draft |
| Owner | camline |
| Last updated | 2026-08-28 |
| Related documents | [01-problem.md](01-problem.md), [04-non-functional-requirements.md](04-non-functional-requirements.md), [plans/user-journeys.md](../plans/user-journeys.md) |
| Prerequisites | [01-problem.md](01-problem.md), [02-current-state.md](02-current-state.md) |
| Revision summary | Extracted from J1–J9 and the product spec; all rows Proposed |

Previous: [02-current-state.md](02-current-state.md) · Next: [04-non-functional-requirements.md](04-non-functional-requirements.md)

## 1. How to read this

Every row is **Proposed**. It is copied from committed journeys and the product spec, not yet confirmed with you.

| Status | Meaning |
|--------|---------|
| Proposed | In the plans; waiting for confirm, change, or drop |
| Confirmed | You accepted it for this pass |
| Deferred | Out of this pass |
| Rejected | Will not build |

Priority uses MoSCoW against the plan's MVP vs Deferred lists. `[Likely]`

IDs are stable for later traceability into a spec. They are not an implementation order.

## 2. Care-seeker

| ID | Requirement | Journey | Priority | Status |
|----|-------------|---------|----------|--------|
| FR-CS-01 | Open the product in a browser or as an installed PWA | J1, J8 | Must | Proposed |
| FR-CS-02 | Hear a spoken greeting and be asked to turn voice on **before** any role picker. Microphone starts only after yes (button or "ndiyo" / "yes") | J8 | Must | Proposed |
| FR-CS-03 | Choose care-seeker or hospital | J1, J4 | Must | Proposed |
| FR-CS-04 | Sign in (plan names Firebase Google + email/password) | J1 | Must | Proposed |
| FR-CS-05 | See a disclaimer: not a diagnosis; in emergency call 999 or go now | J1, J2 | Must | Proposed |
| FR-CS-06 | Enter symptoms with a structured form | J1 | Must | Proposed |
| FR-CS-07 | Speak symptoms; system turns speech into text | J1, J8 | Must | Proposed |
| FR-CS-08 | Map typed or spoken text onto a **catalog** of symptoms. The system does not diagnose | J1, J8 | Must | Proposed |
| FR-CS-09 | Rules assign a **minimum KEPH level** from mapped symptoms | J1 | Must | Proposed |
| FR-CS-10 | Red-flag symptoms skip wait ranking, show nearest KEPH 4+, 999, and "go now". Booking remains allowed | J2 | Must | Proposed |
| FR-CS-11 | Supply location by GPS or a typed Kenyan place | J1 | Must | Proposed |
| FR-CS-12 | See facilities at the required KEPH level or above, ranked lowest wait then nearest | J1, J7 | Must | Proposed |
| FR-CS-13 | Book one facility and see reference, name, KEPH level, map link, wait count | J1 | Must | Proposed |
| FR-CS-14 | Receive booking-confirm SMS, or a demo log when live send is off | J1 | Must | Proposed |
| FR-CS-15 | Receive a reminder phone call at a lead time, plus SMS. Demo mode logs instead of autodialling | J9 | Must | Proposed |
| FR-CS-16 | Receive SMS when marked no-show, with a prompt to rebook if still needed | J3 | Must | Proposed |
| FR-CS-17 | Use the full booking path by voice when voice is on, including without sighted help | J8 | Must | Proposed |
| FR-CS-18 | If voice is declined, complete the same path with visual form, keyboard, and screen-reader labels | J8 | Must | Proposed |
| FR-CS-19 | On first boot, see seeded Kenya facilities ranked even before live registry or auth (baseline stub) | J7 | Must | Proposed |

## 3. Hospital desk and clinician

Same PWA and login in MVP. No separate admin role. `[Verified]`

| ID | Requirement | Journey | Priority | Status |
|----|-------------|---------|----------|--------|
| FR-HS-01 | Sign in as hospital staff scoped to **one** facility | J4 | Must | Proposed |
| FR-HS-02 | See current people-waiting count for that facility only | J4 | Must | Proposed |
| FR-HS-03 | Update the people-waiting number used by ranking | J4 | Must | Proposed |
| FR-HS-04 | See today's bookings for that facility (name or phone last-4, symptoms summary, status) | J5 | Must | Proposed |
| FR-HS-05 | Mark a booking as met (`arrived`). Wait count decrements | J5 | Must | Proposed |
| FR-HS-06 | Mark a booking as did not come (`no_show`). Wait count decrements and FR-CS-16 fires | J5, J3 | Must | Proposed |
| FR-HS-07 | Must not see other facilities' queues or wait counts | J4, J5 | Must | Proposed |
| FR-HS-08 | Add notes on a booking: text, voice-to-text, and/or photo of notes or prescription with stored image + OCR text | J6 | Must | Proposed |
| FR-HS-09 | Another clinician at the **same** facility can read the note | J6 | Must | Proposed |
| FR-HS-10 | Care-seekers cannot read clinical notes in this pass | J6 | Must | Proposed |

## 4. Platform behaviours the users depend on

These are still functional: they are user-visible behaviours, not quality attributes.

| ID | Requirement | Source | Priority | Status |
|----|-------------|--------|----------|--------|
| FR-PL-01 | Creating a booking increments that facility's wait count | [product-spec.md](../plans/product-spec.md) | Must | Proposed |
| FR-PL-02 | Arrived and no-show decrement wait count | Same | Must | Proposed |
| FR-PL-03 | Higher KEPH may accept a lower-level case (`keph_level >= keph_min`) | Same | Must | Proposed |
| FR-PL-04 | Empty database loads a committed Kenya seed (Nairobi facilities with KEPH, lat/lng, demo wait) | Same | Must | Proposed |
| FR-PL-05 | Symptom catalog is ours: canonical symptoms with `keph_min` and red_flag, plus language synonyms | [kenya-pretriage.md](../plans/kenya-pretriage.md) | Must | Proposed |
| FR-PL-06 | Vectors map utterances to catalog; **rules** still pick KEPH. Vectors never pick the hospital level | Same | Must | Proposed |
| FR-PL-07 | Voice and notify vendor failures fail closed to text UI + SMS. Booking is never blocked on voice or telephony | Same | Must | Proposed |
| FR-PL-08 | Demo notify mode logs SMS/calls instead of sending or dialling | J9, P5 issue | Must | Proposed |
| FR-PL-09 | PWA is one origin: `/` landing, `/patient`, `/hospital`, `/hospital/notes`, installable with shortcuts | [product-spec.md](../plans/product-spec.md) | Must | Proposed |
| FR-PL-10 | Cancel a booking | Status enum includes `cancelled` | Could | Proposed |
| FR-PL-11 | Live KMHFR facility sync | Plan; **blocked** on missing research + empty decision log | Should | Proposed |

## 5. Explicit non-goals (Won't for this pass)

From [plans/kenya-pretriage.md](../plans/kenya-pretriage.md) Deferred and [plans/user-journeys.md](../plans/user-journeys.md) Out of journey. `[Verified]` as listed there; still Proposed until you confirm.

| ID | Non-goal |
|----|----------|
| NG-01 | SHA claims / AfyaKE / AfyaLink HIE |
| NG-02 | Live HMIS queues |
| NG-03 | Native mobile apps |
| NG-04 | Ambulance dispatch |
| NG-05 | Pharmacy e-script |
| NG-06 | Clinician-to-clinician referral |
| NG-07 | Inbound IVR to book |
| NG-08 | Diagnosis engine or medical-device claims |
| NG-09 | All 60+ Kenyan languages |
| NG-10 | Real-time websockets (plan says polling is enough) |
| NG-11 | Separate vector databases (Pinecone/Weaviate) |

## 6. Gaps in the functional set

These are behaviours the plans imply or skip. They need a decision, not a guess.

- Who the booking is **for** if a family member books (identity vs phone vs name)
- What happens when GPS is denied and the typed place is ambiguous
- Whether the care-seeker can **cancel** (FR-PL-10) or only the hospital
- Whether wait_count is the staff-entered number, the count of `booked` rows, or a mix
- Confidence floor when symptom mapping is weak: block, ask again, or default to a safe KEPH
- Whether "today's bookings" is calendar-day Africa/Nairobi or a rolling window
- Staff account provisioning (who attaches `facility_id` to a Firebase user)
- Multi-booking by one person at overlapping times
