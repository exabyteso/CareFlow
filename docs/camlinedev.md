# Pre-design working notes

Working notes to lock CareFlow's problem, functional requirements, non-functional requirements, and **product domain map** before high-level system design. Not application code. Not a replacement for [plans/](../plans/) until the team promotes a spec.

This file is the former `docs/camlinedev/README.md`, kept as `camlinedev.md` so it does not clash with [docs/README.md](README.md).

| Field | Value |
|-------|-------|
| Document type | Working-notes index |
| Version | 0.4 |
| Status | Draft |
| Owner | camline |
| Last updated | 2026-08-29 |
| Related documents | [plans/kenya-pretriage.md](../plans/kenya-pretriage.md), [plans/product-spec.md](../plans/product-spec.md), [plans/user-journeys.md](../plans/user-journeys.md) |
| Prerequisites | None |
| Revision summary | Flattened `docs/camlinedev/` into `docs/`; this file replaces the nested README |

## Key files

| File | Role |
|------|------|
| [01-problem.md](01-problem.md) | Problem, users, wedge, what the product is not |
| [02-current-state.md](02-current-state.md) | What is in the repo vs what is still missing |
| [03-functional-requirements.md](03-functional-requirements.md) | Draft FRs extracted from journeys and the spec |
| [04-non-functional-requirements.md](04-non-functional-requirements.md) | Draft NFRs and missing quality attributes |
| [05-open-questions.md](05-open-questions.md) | Grill me: decisions, Round 1 questions, blocked Round 2 |
| [product-map/](product-map/README.md) | Visual domain map: two sides, end-to-end, queue, invariants, scenarios |

## Evidence tags

- `[Verified]`: written in a committed file in this repo
- `[Likely]`: reasonable reading of those files, not stated as a hard rule
- `[Unverified]`: assumed, missing, or contradicted across files

## What these notes are not

- High-level system design, APIs, modules, or stack lock-in
- A substitute for [research/](../research/) scorecards

## Related

- [Documentation index](README.md)
- [Repository root](../README.md)
- [ONBOARDING.md](../ONBOARDING.md)
- [Product spec](../plans/product-spec.md)
- [Kenya pretriage plan](../plans/kenya-pretriage.md)
