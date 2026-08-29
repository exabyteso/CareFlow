# Invariants

| Field | Value |
|-------|-------|
| Document type | Product domain map |
| Version | 0.1 |
| Status | Draft |
| Owner | camline |
| Last updated | 2026-08-28 |
| Related documents | [04-queue-and-bookings.md](04-queue-and-bookings.md), [06-scenarios.md](06-scenarios.md) |
| Prerequisites | [04-queue-and-bookings.md](04-queue-and-bookings.md) |
| Revision summary | Rules that must remain true across scenarios |

Previous: [04-queue-and-bookings.md](04-queue-and-bookings.md) · Next: [06-scenarios.md](06-scenarios.md)

An invariant is a rule that stays true no matter which scenario runs. If a later design breaks one of these, the design is wrong, not the invariant (unless the team explicitly replaces the invariant).

Rows tagged `[needs validation]` are proposed, not locked.

## 1. Product identity

| ID | Invariant |
|----|-----------|
| INV-01 | The product routes. It does not diagnose. Copy always says pretriage. |
| INV-02 | Emergency copy (999 / go now) is available on every care-seeker path, including red flag. |
| INV-03 | Kenya only: facilities, phones `+254`, counties. |
| INV-04 | One PWA, two roles. Hospital staff cannot use another facility's queue. Care-seekers cannot read notes. |

## 2. Routing

| ID | Invariant |
|----|-----------|
| INV-05 | KEPH comes from **rules** on catalog symptoms, never from embeddings alone. |
| INV-06 | Routine ranking: `keph_level >= keph_min`, then lowest wait count, then nearest. |
| INV-07 | Red flag: ignore wait; nearest KEPH 4+; never a quieter distant Level 2. |
| INV-08 | A higher KEPH facility may take a lower-level case. |

## 3. Booking lifecycle

| ID | Invariant |
|----|-----------|
| INV-09 | A booking belongs to exactly one facility. |
| INV-10 | Terminal states are `arrived`, `no_show`, `cancelled`. From `booked` those are the only exits. `[Likely]` |
| INV-11 | No-show SMS is triggered by staff marking no-show, not by a timer we have not defined. |
| INV-12 | Cancel and no-show are different events. |
| INV-13 | Voice, STT, TTS, SMS, or call failure must not block creating a booking. Fail closed to text + SMS / demo log. |

## 4. Queue honesty

| ID | Invariant |
|----|-----------|
| INV-14 | Walk-ins are not automatically rows in the hospital PWA. |
| INV-15 | People already in the physical queue are not re-routed by CareFlow. |
| INV-16 | Ranking may only use wait data the hospital (or the booking lifecycle) actually maintains. No fake live HMIS. |
| INV-17 | Wait count meaning (bodies vs incoming) must be one named rule before implementation. `[needs validation]` |

## 5. Privacy and matching

| ID | Invariant |
|----|-----------|
| INV-18 | Microphone starts only after explicit consent. |
| INV-19 | Notes stay inside the facility that owns the booking. |
| INV-20 | Hospital list shows the minimum identity needed to match a face (name or phone last-4), not a full medical record. |
| INV-21 | Demo / CI never autodials or SMS-blasts unknown numbers. |

## 6. Fairness `[needs validation]`

| ID | Proposed invariant |
|----|--------------------|
| INV-22 | A CareFlow booking does **not** skip the walk-in line unless a later policy says so. First pass: no queue-jump. |
| INV-23 | Staff cannot see other facilities' wait counts or bookings. |
