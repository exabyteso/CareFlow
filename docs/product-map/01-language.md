# Language

| Field | Value |
|-------|-------|
| Document type | Working glossary |
| Version | 0.1 |
| Status | Draft |
| Owner | camline |
| Last updated | 2026-08-28 |
| Related documents | [README.md](README.md), [02-two-sides.md](02-two-sides.md) |
| Prerequisites | [README.md](README.md) |
| Revision summary | First canonical terms for the product map |

Previous: [README.md](README.md) · Next: [02-two-sides.md](02-two-sides.md)

Words below are for this product. When two words fight, the bold term wins. Promote to a repo-root `CONTEXT.md` only after the team locks them.

## 1. People

**Care-seeker**:
The person (or family member) using the care side of the PWA to find a facility and book.
_Avoid_: patient (as the account name), client, user

**Patient-of-booking**:
The person who will actually be seen. May be the care-seeker or a relative. The plans do not yet split these two. `[needs validation]`
_Avoid_: mixing this silently with Care-seeker

**Hospital staff**:
A nurse, clinician, or receptionist at **one** facility. In this pass, desk and clinician share one login and one role.
_Avoid_: admin, doctor-only, receptionist as a separate system user

**Hospital desk**:
The staff job of updating **people waiting** and seeing who is expected.
_Avoid_: a second app or a second account type in this pass

## 2. Place and routing

**Facility**:
A Kenyan health facility with a KEPH level and a location. Kenya only.
_Avoid_: hospital as the only kind (dispensaries and health centres are in scope)

**KEPH level**:
The minimum facility level the case should go to (2 dispensary through 6 national). Higher may take a lower case.
_Avoid_: "hospital tier", "triage score"

**Pretriage**:
Routing a care-seeker to a suitable facility **before** they reach the door. Not a diagnosis.
_Avoid_: diagnosis, triage (in-hospital ETAT+), medical device

**Red flag**:
A symptom that skips wait ranking and sends the person to the nearest KEPH 4+, plus 999 / go now.
_Avoid_: emergency as a vague label without the KEPH 4+ rule

**Symptom catalog**:
Our list of canonical complaints with a minimum KEPH and a red-flag bit. Spoken or typed text maps onto this list. Rules pick KEPH. The list does not diagnose.

## 3. Queue vs booking

**Walk-in**:
Someone already at the facility who never used CareFlow. The product does **not** have their name. `[Likely]` missing from plans; we need the word anyway.
_Avoid_: calling walk-ins "bookings"

**People waiting**:
The physical crowd in the waiting area: walk-ins plus CareFlow people who have arrived and not yet been marked met.
_Avoid_: treating this as identical to open bookings

**Wait count**:
The number the ranking engine uses. Plans say staff can type it, and that creating a booking increments it while arrived/no-show decrements it. That mix is **not yet a coherent meaning**. See [04-queue-and-bookings.md](04-queue-and-bookings.md).
_Avoid_: assuming it is a live HMIS queue

**Booking**:
A CareFlow record that this care-seeker (or patient-of-booking) intends to go to **this** facility. Status: `booked`, `arrived`, `no_show`, `cancelled`.
_Avoid_: appointment slot, clinic diary, timed 14:30 visit (not in the spec)

**Appointment** (as used in J9):
A reminder around a booking. The domain object has timestamps but **no booked clock time**. `[needs validation]` whether this is "come today" or a real slot.
_Avoid_: using "appointment" until Q on time is answered. Prefer **booking** plus **reminder**.

**Queue (hospital PWA)**:
Today's CareFlow bookings for **this** facility. Not the physical line of walk-ins.
_Avoid_: "the queue" without saying which one

## 4. Outcomes

**Arrived** (also: met):
Staff confirm the person is here. Status `arrived`. Optional notes after.
_Avoid_: "checked in" as a kiosk self-service (not in this pass)

**No-show** (also: did not come):
Staff confirm they never arrived. Status `no_show`. Care-seeker gets SMS to rebook if still needed.

**Cancelled**:
The booking will not happen. Who may cancel, and the effect on wait count, are unspecified. `[needs validation]`

**Note**:
Staff-only text, voice transcript, and/or photo (+ OCR) attached to a booking. Care-seekers do not see notes in this pass.
