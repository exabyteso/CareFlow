# End-to-end loop

| Field | Value |
|-------|-------|
| Document type | Product domain map |
| Version | 0.1 |
| Status | Draft |
| Owner | camline |
| Last updated | 2026-08-28 |
| Related documents | [02-two-sides.md](02-two-sides.md), [04-queue-and-bookings.md](04-queue-and-bookings.md) |
| Prerequisites | [02-two-sides.md](02-two-sides.md) |
| Revision summary | Full loop visuals and why each stage exists |

Previous: [02-two-sides.md](02-two-sides.md) · Next: [04-queue-and-bookings.md](04-queue-and-bookings.md)

## 1. The loop in one picture

```mermaid
flowchart TB
  start[Open PWA]
  consent[Voice consent]
  role[Role picker]
  disc[Disclaimer and 999]
  symptoms[Symptoms type or speak]
  map[Map to catalog]
  rules[Rules pick KEPH]
  rank[Rank facilities]
  book[Create booking]
  sms[SMS confirm]
  travel[Care-seeker travels]
  desk[Staff match person]
  close[Arrived or no-show]
  notes[Optional notes]
  start --> consent --> role
  role -->|I need care| disc --> symptoms --> map --> rules
  rules -->|routine| rank
  rules -->|red flag| nearest[Nearest KEPH 4 plus ignore wait]
  nearest --> book
  rank --> book --> sms --> travel --> desk --> close
  close --> notes
  role -->|Hospital| wait[Update people waiting]
  wait --> list[Today bookings]
  list --> desk
  classDef seeker fill:#d6eaf8,stroke:#1f618d,color:#1b2631
  classDef hospital fill:#d5f5e3,stroke:#196f3d,color:#1b2631
  classDef danger fill:#fadbd8,stroke:#922b21,color:#1b2631
  class start,consent,role,disc,symptoms,map,rules,rank,book,sms,travel seeker
  class wait,list,desk,close,notes hospital
  class nearest danger
```

Red-flag path still **allows** a booking so the facility can see them coming. It must not send them to a quiet distant Level 2. `[Verified]`

## 2. Why each stage exists

| Stage | If we skip it |
|-------|----------------|
| Voice consent first | Mic on without permission; low-vision users never get a path |
| Disclaimer / 999 | Product looks like a diagnosis app; emergencies wait on ranking |
| Catalog + rules, not free-text "diagnosis" | We cannot defend KEPH choice; vectors must not pick the hospital |
| Rank wait then distance | Everyone still piles into Kenyatta or the nearest rumour |
| Booking | Hospital cannot tell a CareFlow arrival from a stranger |
| SMS | Family on a basic phone never gets the plan |
| Staff mark arrived / no-show | Wait numbers and "today's list" never close; ranking drifts |
| Staff-typed wait | Walk-ins (the majority today) are invisible to ranking |

## 3. Care-seeker happy path (routine)

```mermaid
sequenceDiagram
  participant CS as CareSeeker
  participant PWA as PWA
  participant Cat as CatalogRules
  participant Fac as Facilities
  participant Desk as HospitalStaff
  CS->>PWA: consent and I need care
  CS->>PWA: symptoms
  PWA->>Cat: map text
  Cat-->>PWA: symptom ids and keph_min
  PWA->>Fac: recommend here and keph_min
  Fac-->>PWA: ranked list
  CS->>PWA: book one facility
  PWA-->>Desk: new booked row
  PWA-->>CS: SMS confirm
  CS->>Desk: arrives
  Desk->>PWA: mark arrived
```

## 4. Hospital happy path

```mermaid
sequenceDiagram
  participant Desk as HospitalStaff
  participant PWA as PWA
  participant CS as CareSeeker
  Desk->>PWA: sign in at this facility
  Desk->>PWA: set people waiting
  Note over Desk,PWA: Ranking for other care-seekers uses this number
  PWA-->>Desk: today's booked rows
  alt person is here
    Desk->>PWA: mark arrived
    Desk->>PWA: optional note
  else person never came
    Desk->>PWA: mark no-show
    PWA-->>CS: SMS rebook if needed
  end
```

## 5. What "done" looks like for one visit

A visit is done when the booking is **arrived**, **no_show**, or **cancelled**. Until then it is incoming load.

The **physical** waiting room is not done when CareFlow is done: walk-ins remain. CareFlow does not empty a county hospital by existing. It only steers **new** care-seekers and accounts for **named** bookings.

Next: how those two crowds relate, and what the plans currently do to `wait_count`.
