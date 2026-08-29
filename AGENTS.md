# CareFlow

Cross-tool baseline for humans and coding agents (Cursor, Claude Code, etc.).

## Stack

- **Stack:** Next.js 15 PWA + FastAPI (Python 3.12); **PostgreSQL 16 + pgvector** is the locked product store ([D-001](research/decision-log.md))
- **Test:** `cd backend && DEMO_NOTIFY=1 DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow pytest`
- **Lint:** `cd frontend && npm run lint` (no backend linter in `backend/pyproject.toml`)

## Repository boundaries

| Path | Role |
|------|------|
| `backend/` | FastAPI: `/health`, `/me`, `/facilities/recommend` (no `/v1`); Alembic `0001` |
| `frontend/` | Next.js 15 PWA: `/` role picker, `/patient` care-seeker, `/hospital` desk |
| `docs/` | Agent SOPs, API reference, testing reference; pre-design notes in [docs/camlinedev.md](docs/camlinedev.md) |
| `plans/` | Committed product/implementation specs |
| `research/` | Market & platform research (`big-picture/` + `ops/`) — see [research/README.md](research/README.md) and [research/AGENTS.md](research/AGENTS.md) |
| `scripts/` | Root operational scripts (PDF pipeline) |

## Directory documentation

Every **top-level** directory (except `.cursor/`, `.claude/`, and tool dirs) should have a short `README.md`. Root [README.md](README.md) is production-oriented; [ONBOARDING.md](ONBOARDING.md) covers local setup. Do **not** add nested `README.md` files unless the user asks — see [docs/directory-readme-practice.md](docs/directory-readme-practice.md).

## Agent workflows

| Topic | Location |
|--------|----------|
| System architecture | [ARCHITECTURE.md](ARCHITECTURE.md) ([PlantUML](ARCHITECTURE.puml)) — target vs as-built |
| Subagent orchestration | [docs/agent-and-subagent-workflow.md](docs/agent-and-subagent-workflow.md) |
| Mode playbooks | [docs/agent-sops/](docs/agent-sops/) |
| API reference (human + agent) | [docs/api/](docs/api/) — [AGENTS.md](docs/api/AGENTS.md) |
| Plan mode grilling | [.cursor/skills/grill-me/SKILL.md](.cursor/skills/grill-me/SKILL.md), [.cursor/rules/grill-me-plan.mdc](.cursor/rules/grill-me-plan.mdc) |
| Testing | [docs/testing-reference.md](docs/testing-reference.md) |
| Research / ADRs | [docs/research/](docs/research/) |
| Research prompt policy | [research/AGENTS.md](research/AGENTS.md), `.cursor/rules/research-prompts.mdc` |
| Senior review | `.cursor/rules/senior-code-review.mdc` |
| PR auto-review (Alex / Grok 4.6) | [docs/agent-sops/alex-pr-review-automation.md](docs/agent-sops/alex-pr-review-automation.md) |

When building with subagents, read **agent-and-subagent-workflow.md** before spawning workers.

## Runtime habits (attach explicitly)

| Mode | Attach before starting |
|------|------------------------|
| **Ask** — senior / PR review | `@senior-review` or `@senior-code-review` |
| **Agent** — multi-wave or Task subagents | `@.cursor/rules/agent-orchestration.mdc` |
| **Plan** — large feature | `@grill-me` or copy `plans/wave-plan.template.md` → `~/.cursor/plans/` |

Optional skills.sh guide: `docs/portable-skills.md` (installed when the `portable-skills` module is enabled at init).

## Deploy and voice tooling

| Surface | Use |
|---------|-----|
| **Firebase Auth** | Project `careflow-kenya`. Local Admin SDK + localhost walkthrough: [ONBOARDING.md](ONBOARDING.md#firebase-localhost). Agents must prompt via Phantom on first run / `GET /me` failures (`.cursor/rules/firebase-localhost.mdc`) — never collect keys in chat. |
| **Render** user-scope hosted MCP (`user-render`) | Deploys, logs, Postgres, env vars. Connected at `https://mcp.render.com/mcp` with OAuth client id `cursor`. **Parent-only** (`list_workspaces`, deploys, logs). Do **not** add a second `render` entry to project `.cursor/mcp.json` or also `/add-plugin render` (duplicate). See `.cursor/rules/render-mcp.mdc`. |
| **ElevenLabs** hosted MCP + skills | Voice agents, TTS, STT (`text-to-speech`, `speech-to-text`, `agents`, `setup-api-key`). Hosted MCP is `https://api.elevenlabs.io/v1/mcp` (OAuth). Product runtime still cascades **ElevenLabs then Pawa** per [plans/kenya-pretriage.md](plans/kenya-pretriage.md). |

## Conventions

- Application code lives in `backend/` and `frontend/`; research artifacts stay in `research/`
- Do not invent a stack — lock it in [research/decision-log.md](research/decision-log.md) and a `plans/` spec first
- Evidence tags in research: `[Verified]` / `[Likely]` / `[Unverified]`
- API prose (once the API exists): [docs/api/](docs/api/) — attach `@.cursor/rules/docs-api-reference.mdc` when authoring
