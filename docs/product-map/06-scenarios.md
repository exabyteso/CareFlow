# Scenarios and edge cases

| Field | Value |
|-------|-------|
| Document type | Product domain map |
| Version | 0.1 |
| Status | Draft |
| Owner | camline |
| Last updated | 2026-08-28 |
| Related documents | [05-invariants.md](05-invariants.md), [03-end-to-end.md](03-end-to-end.md) |
| Prerequisites | [05-invariants.md](05-invariants.md) |
| Revision summary | Happy paths, queue edges, failures, open mismatches |

Previous: [05-invariants.md](05-invariants.md)

Each scenario is something that can happen while using the system. Expected behaviour is taken from the plans where they speak; otherwise it is marked `[needs validation]`.

## 1. Care-seeker scenarios

| ID | Scenario | Expected behaviour |
|----|----------|-------------------|
| S-01 | Routine cough, GPS on, two Level 3s nearby | Rank by wait then distance; book; SMS confirm; staff later mark met |
| S-02 | Chest pain / bleeding / stroke signs / trouble breathing | Skip wait; nearest KEPH 4+; 999; booking still allowed |
| S-03 | Voice on, low vision, speaks Kiswahili | Greeting and consent first; full book-by-voice; no mic until yes |
| S-04 | Voice declined | Visual form + keyboard + screen-reader labels still complete the loop |
| S-05 | Speaks Gĩkũyũ / Dholuo / Kikamba | STT fallback; map to catalog; same KEPH rules |
| S-06 | STT fails twice | Text UI still books; do not block |
| S-07 | SMS vendor down | Demo log or fail closed; booking still exists |
| S-08 | First boot, empty DB | Seed Nairobi facilities still rank (J7) |
| S-09 | GPS denied, types a place | Rank from that place `[needs validation]` if the name is ambiguous |
| S-10 | Symptom text matches nothing well | Ask again, refuse, or conservative KEPH `[needs validation]` |
| S-11 | Family books for a grandmother | Who is the phone, name, and Firebase user `[needs validation]` |
| S-12 | Books two facilities for the same evening | Allowed or blocked `[needs validation]` |
| S-13 | Changes mind, goes elsewhere | Care-seeker cancel `[needs validation]`; else staff no-show later |
| S-14 | Never arrives | Staff no-show; SMS to rebook |
| S-15 | Arrives without the SMS | Staff match on name or last-4; or treat as walk-in `[needs validation]` |
| S-16 | Red flag but books anyway then stays home | Still no-show path; 999 copy already shown |
| S-17 | Wants to chat the receptionist | No chat. SMS + show up. Point them at the booking reference |

## 2. Hospital and queue scenarios

| ID | Scenario | Expected behaviour |
|----|----------|-------------------|
| S-18 | Waiting room already full of walk-ins | Staff raise wait count **now**. People seated stay. New CareFlow users should see a worse rank |
| S-19 | Staff never update wait count | Ranking uses stale number; product becomes harmful. Operational requirement, not a feature |
| S-20 | CareFlow person arrives into a full room | Mark met. They wait with everyone else (no skip-the-line in this pass) `[needs validation]` |
| S-21 | Walk-in has no booking | Not on the PWA list. Count them only via wait number |
| S-22 | Staff mark met | Status arrived; spec decrements wait count (see wait_count tension) |
| S-23 | Staff mark did not come | Status no_show; decrement; SMS |
| S-24 | Staff mark no-show by mistake | No undo in the plans `[needs validation]` |
| S-25 | Two staff at same facility | Both see the same facility queue; both may write notes |
| S-26 | Staff account for facility B | Must not see facility A's list |
| S-27 | Notes: text, voice, photo of a card | Stored for that booking; care-seeker cannot read |
| S-28 | Facility should stop accepting bookings | No "closed" flag yet `[needs validation]` |
| S-29 | Duplicate booking, one person | Staff cancel or no-show the extra `[needs validation]` |
| S-30 | Person arrives after no-show already marked | No reopen path in the plans `[needs validation]` treat as walk-in or undo |

## 3. Reminder and time scenarios

| ID | Scenario | Expected behaviour |
|----|----------|-------------------|
| S-31 | Reminder call, en/sw | Outbound call + SMS; demo mode logs only |
| S-32 | Reminder, Kikuyu/Luo/Kamba | TTS fallback on the call, or SMS only |
| S-33 | No `due_at` on the booking | T minus 2 hours has no clock `[needs validation]` use come-when-you-can and skip timed reminder, or add a time |
| S-34 | CI / demo | Never dial random numbers |

## 4. Failure and abuse

| ID | Scenario | Expected behaviour |
|----|----------|-------------------|
| S-35 | Vendor timeout on TTS | One fallback, then text |
| S-36 | Offline PWA, no API | Unspecified. `[needs validation]` online-only is the safe first pass |
| S-37 | Care-seeker role on a staff phone | They can book as a care-seeker; they must not see notes |
| S-38 | Hospital role without `facility_id` | Cannot be a valid staff session `[Likely]` |
| S-39 | Ranking with null coordinates | Facility dropped |

## 5. Scenario that must not happen

| ID | Forbidden | Why |
|----|-----------|-----|
| X-01 | Quiet Level 2 recommended for chest pain | INV-07 |
| X-02 | Diagnosis language in the UI | INV-01 |
| X-03 | Mic on before consent | INV-18 |
| X-04 | Staff of A seeing B's queue | INV-04 |
| X-05 | Care-seeker reading clinical notes | INV-04 |
| X-06 | Booking blocked because voice failed | INV-13 |
| X-07 | SMS to walk-ins telling them to leave | INV-15 |
| X-08 | Pretend wait_count is a live HMIS feed | INV-16 |

## 6. Open mismatches to close before high-level design

These are the remaining product questions this map cannot honestly paper over. They are the next grill frontier (Round 2), not stack choices.

1. **Wait count meaning:** bodies in the room vs incoming bookings vs hybrid (section 2 of [04-queue-and-bookings.md](04-queue-and-bookings.md)).
2. **Timed visit or come-when-you-can.**
3. **Who may cancel**, and whether wait count moves.
4. **Family booking** identity.
5. **Undo** for wrong arrived / no-show.
6. **Closed / not accepting** when the room is full.
7. **Door match miss:** always walk-in, or create a booking at the desk.

Until those have letters, do not draw component diagrams, APIs, or a stack. This map is the product. High-level design comes after.
