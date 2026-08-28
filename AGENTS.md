# CareFlow

Cross-tool baseline for humans and coding agents (Cursor, Claude Code, etc.).

## Stack

- **Stack:** Next.js + FastAPI; **PostgreSQL + pgvector** is the locked product store ([D-001](research/decision-log.md))
- **Test:** `echo 'Set TEST_COMMAND in docs/testing-reference.md'`
- **Lint:** `echo 'Set LINT_COMMAND in AGENTS.md'`

## Repository boundaries

| Path | Role |
|------|------|
| `backend/` | API and domain logic — empty until spec + stack land |
| `frontend/` | User-facing app — empty until spec + stack land |
| `prototype/` | Hospital ticketing UI prototype — Vite dev server in [prototype/README.md](prototype/README.md) |
| `docs/` | Agent SOPs, API reference stubs, testing reference |
| `plans/` | Committed product/implementation specs |
| `camlinedev/` | Pre-design working notes: problem, draft FRs/NFRs, grill-me questions — see [camlinedev/README.md](camlinedev/README.md) |
| `research/` | Market & platform research (`big-picture/` + `ops/`) — see [research/README.md](research/README.md) and [research/AGENTS.md](research/AGENTS.md) |
| `scripts/` | Root operational scripts (PDF pipeline) |

## Directory documentation

Every **top-level** directory (except `.cursor/`, `.claude/`, and tool dirs) should have a short `README.md`. Root [README.md](README.md) is production-oriented; [ONBOARDING.md](ONBOARDING.md) covers local setup. Do **not** add nested `README.md` files unless the user asks — see [docs/directory-readme-practice.md](docs/directory-readme-practice.md).

## Agent workflows

| Topic | Location |
|--------|----------|
| Subagent orchestration | [docs/agent-and-subagent-workflow.md](docs/agent-and-subagent-workflow.md) |
| Mode playbooks | [docs/agent-sops/](docs/agent-sops/) |
| API reference (human + agent) | [docs/api/](docs/api/) — [AGENTS.md](docs/api/AGENTS.md) |
| Plan mode grilling | [.cursor/skills/grill-me/SKILL.md](.cursor/skills/grill-me/SKILL.md), [.cursor/rules/grill-me-plan.mdc](.cursor/rules/grill-me-plan.mdc) |
| Testing | [docs/testing-reference.md](docs/testing-reference.md) |
| Research / ADRs | [docs/research/](docs/research/) |
| Research prompt policy | [research/AGENTS.md](research/AGENTS.md), `.cursor/rules/research-prompts.mdc` |
| Senior review | `.cursor/rules/senior-code-review.mdc` |

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
| **Render** Cursor plugin MCP | Deploys, logs, Postgres, env vars. Install with `/add-plugin render` (user scope). Do **not** add a second `render` entry in `mcp.json`. |
| **ElevenLabs** hosted MCP + skills | Voice agents, TTS, STT (`text-to-speech`, `speech-to-text`, `agents`, `setup-api-key`). Hosted MCP is `https://api.elevenlabs.io/v1/mcp` (OAuth). Product runtime still cascades **ElevenLabs then Pawa** per [plans/kenya-pretriage.md](plans/kenya-pretriage.md). |

## Conventions

- Application code lives in `backend/` and `frontend/`; research artifacts stay in `research/`
- Do not invent a stack — lock it in [research/decision-log.md](research/decision-log.md) and a `plans/` spec first
- Evidence tags in research: `[Verified]` / `[Likely]` / `[Unverified]`
- API prose (once the API exists): [docs/api/](docs/api/) — attach `@.cursor/rules/docs-api-reference.mdc` when authoring
