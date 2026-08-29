# Product map (`docs/product-map/`)

Visual domain map of CareFlow. Two sides: care-seeker and hospital. One shared object: the booking. This folder explains how the product works to the end, why queues matter, and what the written plans still leave open.

| Field | Value |
|-------|-------|
| Document type | Product domain map index |
| Version | 0.1 |
| Status | Draft |
| Owner | camline |
| Last updated | 2026-08-28 |
| Related documents | [../camlinedev.md](../camlinedev.md), [../01-problem.md](../01-problem.md), [../../plans/user-journeys.md](../../plans/user-journeys.md), [../../ARCHITECTURE.md](../../ARCHITECTURE.md) |
| Prerequisites | [../01-problem.md](../01-problem.md) |
| Revision summary | First map: language, two sides, loop, queue vs booking, invariants, scenarios |

This folder is **domain-only** (language, two sides, loop, invariants). System topology — PWA, FastAPI packages, Postgres, Firebase, vendors — lives in [ARCHITECTURE.md](../../ARCHITECTURE.md) and [ARCHITECTURE.puml](../../ARCHITECTURE.puml). Wait-count meaning (bodies vs incoming) remains an open product question ([04-queue-and-bookings.md](04-queue-and-bookings.md)); the architecture states the current spec: desk-typed `wait_count` ([INV-16](05-invariants.md)).

## Reading order

| File | Role |
|------|------|
| [01-language.md](01-language.md) | Canonical words. Read this first |
| [02-two-sides.md](02-two-sides.md) | Care-seeker side, hospital side, how they connect |
| [03-end-to-end.md](03-end-to-end.md) | Full loop, visuals, why each step exists |
| [04-queue-and-bookings.md](04-queue-and-bookings.md) | Walk-ins already there, wait_count, appointments, cancel, no-show |
| [05-invariants.md](05-invariants.md) | Rules that must stay true |
| [06-scenarios.md](06-scenarios.md) | Happy paths, edges, failures |

## Related

- [System architecture](../../ARCHITECTURE.md)
- [Pre-design working notes](../camlinedev.md)
- [Draft FRs](../03-functional-requirements.md)
- [Grill me questions](../05-open-questions.md)
