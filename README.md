# CareFlow

Kenya hospital pretriage: map symptoms to the right KEPH level, recommend the nearest facility with the shortest hospital-reported wait, and book — with SMS and voice reminders.

This monorepo holds the locked product spec, research, agent scaffolding, and the FastAPI + Next.js PWA trees. **Local development** uses Docker Compose (the default). This is **not** a production service. **Staging** is live on Render from the `dev` branch ([ONBOARDING.md](ONBOARDING.md#staging-render)).

**GitHub:** [github.com/exabyteso/CareFlow](https://github.com/exabyteso/CareFlow)

## Documentation map

| Directory | README | Topics |
|-----------|--------|--------|
| `backend/` | [backend/README.md](backend/README.md) | FastAPI (Python 3.12), Alembic, `/health` `/me` `/facilities/recommend` |
| `frontend/` | [frontend/README.md](frontend/README.md) | Next.js 15 PWA: role picker, care-seeker, hospital desk |
| `docs/` | [docs/README.md](docs/README.md) | Agent SOPs, API reference, testing, [pre-design notes](docs/camlinedev.md) |
| `docs/product-map/` | [docs/product-map/README.md](docs/product-map/README.md) | Domain map: two sides, queue vs booking |
| `plans/` | [plans/README.md](plans/README.md) | Committed specs, wave plan template |
| `research/` | [research/README.md](research/README.md) | Market (`big-picture/`) and ops research |
| `scripts/` | [scripts/README.md](scripts/README.md) | PDF generation and other root scripts |

**Local development:** [ONBOARDING.md](ONBOARDING.md)  
**Agents and coding tools:** [AGENTS.md](AGENTS.md)  
**System architecture:** [ARCHITECTURE.md](ARCHITECTURE.md) ([PlantUML](ARCHITECTURE.puml)) — target topology vs what is running now.

## Conventions

One repo, two app trees (`backend/`, `frontend/`) plus research and docs. **Primary database is locked:** PostgreSQL 16 + pgvector ([D-001](research/decision-log.md)). Application stack is Next.js 15 PWA + FastAPI per [plans/kenya-pretriage.md](plans/kenya-pretriage.md). Product language: care-seeker, hospital staff/desk, pretriage (not diagnosis); `wait_count` is a desk-typed ranking input, not HMIS.

See [docs/directory-readme-practice.md](docs/directory-readme-practice.md) for README conventions. Add a row to the table above when you introduce a new top-level directory.
