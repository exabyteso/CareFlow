# CareFlow

Kenya hospital pretriage: map symptoms to the right KEPH level, recommend the nearest facility with the shortest hospital-reported wait, and book — with SMS and voice reminders.

This monorepo holds the locked product spec, research, agent scaffolding, and `backend/` / `frontend/` trees. It is **not** a deployed service yet.

**GitHub:** [github.com/exabyteso/CareFlow](https://github.com/exabyteso/CareFlow)

## Documentation map

| Directory | README | Topics |
|-----------|--------|--------|
| `backend/` | [backend/README.md](backend/README.md) | API and domain logic (stack TBD) |
| `frontend/` | [frontend/README.md](frontend/README.md) | User-facing app (stack TBD) |
| `prototype/` | [prototype/README.md](prototype/README.md) | Hospital ticketing UI prototype (Vite) |
| `docs/` | [docs/README.md](docs/README.md) | Agent SOPs, API reference stubs, testing |
| `plans/` | [plans/README.md](plans/README.md) | Committed specs, wave plan template |
| `camlinedev/` | [camlinedev/README.md](camlinedev/README.md) | Pre-design problem, draft FRs/NFRs, grill-me questions |
| `research/` | [research/README.md](research/README.md) | Market (`big-picture/`) and ops research |
| `scripts/` | [scripts/README.md](scripts/README.md) | PDF generation and other root scripts |

**Local development:** [ONBOARDING.md](ONBOARDING.md)  
**Agents and coding tools:** [AGENTS.md](AGENTS.md)

## Conventions

One repo, two app trees (`backend/`, `frontend/`) plus research and docs. **Primary database is locked:** PostgreSQL + pgvector ([D-001](research/decision-log.md)). Application stack is in [plans/kenya-pretriage.md](plans/kenya-pretriage.md).

See [docs/directory-readme-practice.md](docs/directory-readme-practice.md) for README conventions. Add a row to the table above when you introduce a new top-level directory.
