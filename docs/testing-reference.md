# Testing reference — CareFlow

## Commands

| Layer | Command |
|-------|---------|
| Default (unit + integration) | `cd backend && DEMO_NOTIFY=1 DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow pytest` |
| Lint | `cd frontend && npm run lint` |
| E2E / slow | *(none yet)* |

Compose `api` migrates itself on boot. Host pytest against **db only** still needs `alembic upgrade head` (CI path unchanged: db only → host Alembic → pytest).

Typical local order — full compose (`db` + `api`); no manual Alembic exec:

```bash
docker compose up --build -d
cd backend && DEMO_NOTIFY=1 DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow pytest
```

Typical local order — db only (pytest / CI); still run Alembic on the host:

```bash
docker compose up -d db
cd backend && DATABASE_ADMIN_URL=postgresql://careflow_owner:careflow_owner@localhost:5432/careflow alembic upgrade head
DEMO_NOTIFY=1 DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow pytest
```

`DEMO_NOTIFY=1` never live-dials. There is no backend linter in `backend/pyproject.toml`; do not invent one.

## Pyramid

1. **Unit** — pure logic, mappers, utilities
2. **Integration** — API, DB, HTTP boundaries
3. **E2E** — critical user paths after unit/integration green

## Agent iteration

1. **Narrow** — smallest command that reproduces the failure
2. **Fix** — one layer (stub | app | assertion)
3. **Re-run narrow**
4. **Broaden** only when justified

See [agent-and-subagent-workflow.md](./agent-and-subagent-workflow.md) §6 (runner/fixer).

## Triage checklist

- [ ] Reproduces on CI or locally with documented env?
- [ ] Flaky vs deterministic?
- [ ] Wrong assertion vs wrong app behaviour vs missing stub?
- [ ] Shared types / API contract drift?
