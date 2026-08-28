# CareFlow — onboarding

Engineers setting up this repository for the first time. For production-oriented overview, see [README.md](README.md).

## Prerequisites

Stack is **not chosen yet**. Until then you only need:

- Git
- Node (for PDF scripts under `scripts/pdf/` and Phantom CLI)
- [Phantom](https://phm.dev) for secrets (see below)

Add language runtimes, Docker, and package managers when `backend/` / `frontend/` stacks are decided.

## First-time setup

```bash
cp .env.example .env
phantom init
# phantom add VAR_NAME   # when the first secret exists
```

Do not start the production app yet — there is no runnable backend or frontend. To preview the hospital ticketing prototype, see [prototype/README.md](prototype/README.md).

## Verify

Test and lint commands are placeholders until a stack is chosen. See [docs/testing-reference.md](docs/testing-reference.md).

## Directory map

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

Add a row when you create a new top-level directory. Keep command details in linked READMEs — do not duplicate them here.

## Cursor plugins and MCP

Agent tooling for deploy and voice. No API keys in `mcp.json`. Both MCPs can create, change, or delete cloud resources — only grant access you are comfortable with.

**Render (plugin, user scope — all projects):**

1. In Cursor chat, run `/add-plugin render`.
2. Choose **user** scope, then **Authenticate** in the browser.
3. Verify: ask the agent to run `list_workspaces`.

Do **not** add a `render` entry to `.cursor/mcp.json` or `~/.cursor/mcp.json` — the plugin already provides the hosted MCP (`https://mcp.render.com/mcp`). If the plugin UI fails, add that URL in Customize → MCP with OAuth client id `cursor` instead.

**ElevenLabs (hosted MCP, OAuth):**

1. This repo already lists `elevenlabs` in [`.cursor/mcp.json`](.cursor/mcp.json) (`https://api.elevenlabs.io/v1/mcp`).
2. In **Customize → MCP**, click **Connect** / **Authenticate** for ElevenLabs and finish the browser OAuth. No API key.
3. If Cursor also loaded the same server from `~/.cursor/mcp.json`, disable one copy in Customize rather than deleting the repo file (teammates still need it).

**Phantom MCP:** [`.cursor/mcp.json`](.cursor/mcp.json) already includes the `phantom` stdio server. After Cursor reloads MCP, agents can use `phantom_add_secret_interactive` and `phantom_list_secrets` without exposing values in chat.

## Secrets (Phantom)

This project manages secrets with [Phantom](https://phm.dev) — API keys live in the OS keychain, not in `.env`.

**One-time machine setup:**

```bash
npm i -g phantom-secrets
npm i -g phantom-secrets-mcp
phantom init   # creates OS vault entry
```

**Add a secret** (replace `VAR_NAME` with the actual variable, e.g. `MAILSINK_API_KEY`):

```bash
phantom add VAR_NAME
# or via MCP: phantom_add_secret_interactive
```

**Variables used by this project:**

| Variable | Purpose |
|----------|---------|
| `EXAMPLE_API_KEY` | Replace with real variable name and purpose |
| `ELEVENLABS_API_KEY` | App runtime for P5 TTS/STT/calls (`phantom add ELEVENLABS_API_KEY`). **Not** required to connect the hosted ElevenLabs MCP (that uses OAuth). |

**`.env` file:** Contains phantom tokens (`phm_...`), not real secrets. Safe to commit if tracked; real values are injected by `phantom exec` at runtime.

## Related

- [README.md](README.md) — production-oriented overview
- [AGENTS.md](AGENTS.md) — agent baseline
- [docs/directory-readme-practice.md](docs/directory-readme-practice.md) — README conventions
