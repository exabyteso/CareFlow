# CareFlow — onboarding

Engineers setting up this repository for the first time. For production-oriented overview, see [README.md](README.md).

## Prerequisites

- Git
- [Docker](https://docs.docker.com/get-docker/) (Compose services `db` + `api`)
- Node 20 (PWA `frontend/` and Phantom CLI)
- Python 3.12 is **optional** on the host — Compose builds the FastAPI image
- [Phantom](https://phm.dev) for secrets (see below)

Locked stack: Next.js 15 PWA + FastAPI (Python 3.12) + PostgreSQL 16 + pgvector ([D-001](research/decision-log.md)).

## First-time setup

```bash
cp .env.example .env
phantom init
# Firebase Admin SDK — see Firebase (localhost) below. Without it, /health
# still works; GET /me and demo Auth user seed do not.

phantom exec -- docker compose up --build -d
# wait until db and api are healthy — api migrates then seeds on boot
curl localhost:8000/health   # {"status":"ok"}

cd frontend && npm install && npm run dev   # :3000
```

`phantom exec -- docker compose up --build -d` is enough for migrate + seed **and** injects `FIREBASE_*` into `api`. Plain `docker compose up` is fine for `/health` only. Do **not** run a separate `alembic upgrade head` on this first-time compose path. **Host pytest against `db` only** still needs Alembic on the host — see [docs/testing-reference.md](docs/testing-reference.md) (CI starts `db` only, then host Alembic + pytest).

After Compose is healthy, read [ARCHITECTURE.md](ARCHITECTURE.md) for target topology versus what is running now. For hosted **staging** (Render Blueprint, not production; live inventory), see [Staging (Render)](#staging-render).

PWA: `/` role picker (no mic), `/patient` care-seeker + 999, `/hospital` desk this-facility-only. Manifest shortcuts `/patient` and `/hospital`. Service worker is online-only (does not cache API). There is **no PWA login UI this pass** (`frontend/app/page.tsx` is still a role picker).

`DEMO_NOTIFY=1` never live-dials. CORS allowlist is `FRONTEND_ORIGIN`. Env names: [`.env.example`](.env.example).

## Firebase (localhost)

Firebase is **auth only**. Product data stays in PostgreSQL ([D-001](research/decision-log.md)). The Google project **`careflow-kenya`** is already created (display name CareFlow). Do **not** create a second Firebase project unless the user cannot access this one and explicitly asks.

| Piece | Status | Where |
|-------|--------|--------|
| Firebase project + web app | Provisioned | [Console](https://console.firebase.google.com/project/careflow-kenya/overview) |
| Auth providers | Email/password + Google Sign-In | [Providers](https://console.firebase.google.com/project/careflow-kenya/authentication/providers) · `firebase.json` |
| PWA client SDK | Committed (public web keys) | `frontend/lib/firebase.ts`, `frontend/lib/firebase-config.ts` |
| Admin SDK (`FIREBASE_*`) | **You add this** via Phantom | FastAPI `GET /me`, boot seed of demo Auth users |

The web `apiKey` in `firebase-config.ts` is **not** a secret and is **not** `FIREBASE_PRIVATE_KEY`. Never put the Admin private key in the browser, git, or chat.

### Walkthrough — first clone or first run

Agents: follow this on onboarding, `docker compose` / `npm run dev`, or any Firebase / `GET /me` failure. **Never ask the user to paste keys, JSON, or tokens into chat.** Use Phantom (`phantom add` or MCP `phantom_add_secret_interactive`).

1. **Confirm the project.** Console: [careflow-kenya](https://console.firebase.google.com/project/careflow-kenya/overview). If the user is not on this Google account, use the Firebase MCP `firebase_login` flow (show them the login URL **and** session ID). If they lack access, they need an invite — do not create `careflow-*` unless they ask.
2. **Generate an Admin SDK key** (human in the browser): [Service accounts](https://console.firebase.google.com/project/careflow-kenya/settings/serviceaccounts/adminsdk) → **Generate new private key**. A JSON file downloads. It contains `project_id`, `client_email`, and `private_key`. Do not commit that file; delete it after Phantom has the values.
3. **Store the three Admin vars in Phantom** (from the repo root, after `phantom init`):

   ```bash
   phantom add FIREBASE_PROJECT_ID      # careflow-kenya
   phantom add FIREBASE_CLIENT_EMAIL    # client_email from the JSON
   phantom add FIREBASE_PRIVATE_KEY     # private_key including -----BEGIN/END----- and newlines
   ```

   Or ask the agent to run `phantom_add_secret_interactive` for each name. Values stay in the OS keychain; `.env` should hold `phm_…` tokens only.
4. **Restart the API so Compose interpolates the secrets:**

   ```bash
   phantom exec -- docker compose up --build -d
   curl localhost:8000/health   # {"status":"ok"}
   ```

   `api` reads `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` from the host ([docker-compose.yml](docker-compose.yml)). Without `phantom exec`, those env vars are empty: boot seed skips Auth upsert and `GET /me` returns **401**.
5. **PWA on localhost:3000** — no extra Firebase env. From `frontend/`: `npm install && npm run dev`. Client init is `frontend/lib/firebase.ts`. There is no sign-in form on `/` this pass.
6. **Re-seed** (optional): `docker compose exec api python -m app.seed`. With Admin credentials, this upserts the demo Firebase Auth users below.

### Local demo accounts

**Local/demo only. Never use these credentials on a production Firebase project.**

| Email | Password | Role | Facility | Firebase UID |
|-------|----------|------|----------|--------------|
| `patient@careflow.local` | `CareflowDemo1!` | care-seeker (`patient`) | — | `demo-patient` |
| `staff@careflow.local` | `CareflowDemo1!` | hospital staff | Kenyatta National Hospital (`SEED-NBO-KNH`) | `demo-staff` |

These are for operators, curl / `GET /me`, and a later PWA login UI — not a form on `/` this pass. `GET /me` needs `Authorization: Bearer <Firebase ID token>` ([docs/api/me.md](docs/api/me.md)).

### When it fails

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| `GET /me` → 401 `unauthorized` | Missing/invalid Bearer, or Admin SDK not configured | Walkthrough steps 2–4. Confirm Compose was started with `phantom exec`. |
| API log: `Firebase Admin credentials are not configured; skipping demo Auth upsert` | `FIREBASE_*` empty in the `api` container | Same — Phantom add + `phantom exec -- docker compose up --build -d`. |
| `user_not_provisioned` (404) | Token is valid but UID is not `demo-patient` / `demo-staff` (and not otherwise seeded) | Expected for unknown Google accounts. Seed or use a demo email. |
| Google popup closes: `auth/unauthorized-domain` | Host not in Auth authorized domains | `localhost` is default. Staging PWA: add `careflow-web.onrender.com` ([Staging (Render)](#staging-render)). Custom hosts: [Auth settings](https://console.firebase.google.com/project/careflow-kenya/authentication/settings). |

Agents: if Phantom MCP is connected, call `phantom_list_secrets` (names only) before prompting. If `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, or `FIREBASE_PRIVATE_KEY` are missing, start this walkthrough immediately — do not treat `/health` as “Firebase is working.”

## Verify

```bash
curl localhost:8000/health
cd backend && DEMO_NOTIFY=1 DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow pytest
```

Host pytest talks to Compose `db` only. Full compose (`db` + `api`) migrates on boot; **db-only** (pytest / CI) still needs `alembic upgrade head` on the host. See [docs/testing-reference.md](docs/testing-reference.md).

Once `api` is up, Swagger UI is at [http://localhost:8000/docs](http://localhost:8000/docs). Committed OpenAPI: [backend/openapi/openapi.yaml](backend/openapi/openapi.yaml). Postman (repo JSON only): [docs/api/CareFlow.postman_collection.json](docs/api/CareFlow.postman_collection.json) and [docs/api/CareFlow.postman_environment.json](docs/api/CareFlow.postman_environment.json).

## Staging (Render)

Not production. Do not treat this as NFR-AVAIL-01. Local Compose remains the default for development.

**Blueprint applied** (2026-08-28+): [`exs-da91jphsrm7s73atarb0`](https://dashboard.render.com/blueprint/exs-da91jphsrm7s73atarb0) — repo `exabyteso/CareFlow`, branch **`dev`**, workspace **My Workspace** (`tea-da90etlg1s2s738q8l9g`). Do **not** create a second Blueprint. IaC remains [render.yaml](render.yaml).

| Service | Kind | ID | Public URL / notes |
|---------|------|----|--------------------|
| **careflow-api** | Docker (`./backend/Dockerfile`), Starter, Oregon | `srv-da91rdhsrm7s73atu4ig` | [`https://careflow-api-y00r.onrender.com`](https://careflow-api-y00r.onrender.com) — live. `GET /health` → `{"status":"ok"}`. `autoDeployTrigger: checksPass`. |
| **careflow-web** | Node (`./build.sh` / `cd frontend && npm run start`), Starter | `srv-da91re1srm7s73atu5eg` | [`https://careflow-web.onrender.com`](https://careflow-web.onrender.com). First web build may have raced the API hostname (`NEXT_PUBLIC_API_URL` is build-time). |
| **careflow-db** | Postgres 16, plan `0.1c-256mb`, Oregon | `dpg-da91r39srm7s73attatg-a` | After Alembic `0001` on boot: extensions `plpgsql`, `vector`, `cube`, `earthdistance`. No separate dashboard SQL unless they are missing. |

**Leftover (not this Blueprint):** static site **CareFlow** (`srv-da91buqjnfac73ccfisg`) at [`https://careflow-sei7.onrender.com`](https://careflow-sei7.onrender.com). Still running. Humans suspend it after careflow-web is live; **agents must not delete it.**

Render MCP **cannot** create Docker web services. Further API changes: git push to **`dev`** (after CI checks) or parent `trigger_deploy` on namespace `user-render`. Pass `workspaceId` `tea-da90etlg1s2s738q8l9g` on each MCP call. Do **not** `/add-plugin render` or add a second `render` block to project `.cursor/mcp.json`.

### Remaining human steps (not agent work)

1. Dashboard → **careflow-api** → Environment: paste `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (`sync: false`) if not already set. Never into chat. This is the remaining auth gate for `GET /me` if secrets were missing.
2. Firebase Auth [authorized domains](https://console.firebase.google.com/project/careflow-kenya/authentication/settings) on project **`careflow-kenya`**: add `careflow-web.onrender.com` (and `careflow-sei7.onrender.com` only if that static site stays). Do **not** create a second Firebase project.
3. After careflow-web is live, **suspend** leftover static site CareFlow. Agents must not delete it.
4. If the first web deploy baked an empty `NEXT_PUBLIC_API_URL`, rebuild/redeploy **careflow-web** after the API URL exists.

### CI/CD

Push or merge to **`dev`** → GitHub Actions **`CI / test`** and **`CI / lint`** → Render `autoDeployTrigger: checksPass`. Not a GitHub Actions deploy job. Not production on `main`. `DEMO_NOTIFY=1`. Those GitHub checks **must exist on `dev`** or `checksPass` will not deploy.

`careflow-web` builds from the repository root via [`./build.sh`](build.sh) (`npm ci` + `next build` in `frontend/`). Start is `cd frontend && npm run start`. `NEXT_PUBLIC_API_URL` is build-time (from `careflow-api` `RENDER_EXTERNAL_URL`).

### Dashboard secrets (`sync: false`)

Paste in the Render dashboard on **careflow-api** if missing. Names only — no values in this repo or chat.

**Required for `GET /me`:**

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

**Leave empty this pass:**

- `AFRICAS_TALKING_*`
- `ELEVENLABS_API_KEY`
- `TWILIO_*`
- `PAWA_AI_API_KEY`

**Blueprint-wired (do not paste):** `DATABASE_URL` and `DATABASE_ADMIN_URL` both from `careflow-db` `connectionString` (staging shortcut — same owner string for both; dual `careflow` / `careflow_owner` + RLS is out of scope). `FRONTEND_ORIGIN` from `careflow-web` `RENDER_EXTERNAL_URL`. `NEXT_PUBLIC_API_URL` from `careflow-api` `RENDER_EXTERNAL_URL`.

## Directory map

| Directory | README | Topics |
|-----------|--------|--------|
| `backend/` | [backend/README.md](backend/README.md) | FastAPI, Alembic, health / me / recommend |
| `frontend/` | [frontend/README.md](frontend/README.md) | Next.js 15 PWA shells |
| `docs/` | [docs/README.md](docs/README.md) | Agent SOPs, API reference, testing, [pre-design notes](docs/camlinedev.md) |
| `docs/product-map/` | [docs/product-map/README.md](docs/product-map/README.md) | Domain map: two sides, queue vs booking |
| `plans/` | [plans/README.md](plans/README.md) | Committed specs, wave plan template |
| `research/` | [research/README.md](research/README.md) | Market (`big-picture/`) and ops research |
| `scripts/` | [scripts/README.md](scripts/README.md) | PDF generation and other root scripts |
| `mosescodes/` | [mosescodes/README.md](mosescodes/README.md) | P2 working notes (Moses): facilities, KMHFR, symptoms, bookings |

Add a row when you create a new top-level directory. Keep command details in linked READMEs — do not duplicate them here.

## PR auto-review (Alex)

Same-repo PRs targeting `dev` or `main` are reviewed by a Cursor Cloud Agent (Grok 4.6, Alex senior bar). GitHub squash-auto-merges only after that approval **and** CI jobs `test` and `lint` are green.

Create or edit the Cloud Agent in the **Agents Window** (`/automate`) using [docs/agent-sops/alex-pr-review-automation.md](docs/agent-sops/alex-pr-review-automation.md). This IDE chat cannot save Automations.

## Cursor plugins and MCP

Agent tooling for deploy, Firebase, and voice. No API keys in `mcp.json`. These MCPs can create, change, or delete cloud resources — only grant access you are comfortable with.

**Render (user-scope hosted MCP — all projects):**

This machine uses the hosted MCP fallback (not the marketplace plugin):

1. `~/.cursor/mcp.json` lists `render` at `https://mcp.render.com/mcp` with `auth.CLIENT_ID` `cursor`.
2. Authenticate once in the browser (agent calls `mcp_auth` on namespace `user-render`).
3. Verify: `list_workspaces`. Parent-only — subagents do not get this MCP.

Do **not** add a second `render` entry to project [`.cursor/mcp.json`](.cursor/mcp.json). Do **not** also run `/add-plugin render` while the user `mcp.json` entry exists (duplicate servers). On a new machine, either keep this hosted-MCP pattern **or** use `/add-plugin render` (user scope) — pick one.

**Firebase (Cursor plugin MCP):** Auth project `careflow-kenya`. The Firebase plugin provides MCP (`firebase_login`, project/app tools). Do **not** add a second `firebase` block to `.cursor/mcp.json`. Local Admin SDK walkthrough: [Firebase (localhost)](#firebase-localhost).

**ElevenLabs (hosted MCP, OAuth):**

1. This repo already lists `elevenlabs` in [`.cursor/mcp.json`](.cursor/mcp.json) (`https://api.elevenlabs.io/v1/mcp`).
2. In **Customize → MCP**, click **Connect** / **Authenticate** for ElevenLabs and finish the browser OAuth. No API key.
3. If Cursor also loaded the same server from `~/.cursor/mcp.json`, disable one copy in Customize rather than deleting the repo file (teammates still need it).
4. App runtime keys (`ELEVENLABS_API_KEY`) stay in Phantom for later P5. If a skill asks you to write a key into `.env`, use `phantom add ELEVENLABS_API_KEY` instead and do not paste the key into chat.

**Phantom MCP:** [`.cursor/mcp.json`](.cursor/mcp.json) already includes the `phantom` stdio server. After Cursor reloads MCP, agents can use `phantom_add_secret_interactive` and `phantom_list_secrets` without exposing values in chat.

## Secrets (Phantom)

This project manages secrets with [Phantom](https://phm.dev) — API keys live in the OS keychain, not in `.env`.

**One-time machine setup:**

```bash
npm i -g phantom-secrets
npm i -g phantom-secrets-mcp
phantom init   # creates OS vault entry
```

**Add a secret** (replace `VAR_NAME` with the actual variable, e.g. `FIREBASE_PRIVATE_KEY`):

```bash
phantom add VAR_NAME
# or via MCP: phantom_add_secret_interactive
```

**Variables used by this project:** see [`.env.example`](.env.example). Names that matter locally:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | App-role Postgres (`careflow`). Compose sets this for `api`. |
| `DATABASE_ADMIN_URL` | Owner URL for Alembic (`careflow_owner`). |
| `FRONTEND_ORIGIN` | CORS allowlist for the PWA (default `http://localhost:3000`). |
| `NEXT_PUBLIC_API_URL` | PWA API base (default `http://localhost:8000`). |
| `DEMO_NOTIFY` | `1` = never live-dial or SMS-blast. Keep `1` unless you intend vendor traffic. |
| `FIREBASE_*` | Admin SDK for `GET /me` and boot seed (Phantom). Walkthrough: [Firebase (localhost)](#firebase-localhost). Demo UIDs in [Local demo accounts](#local-demo-accounts). |
| `ELEVENLABS_API_KEY` | App runtime for later TTS/STT/calls. **Not** required for hosted ElevenLabs MCP OAuth. |
| `ELEVENLABS_VOICE_ID` | ElevenLabs TTS voice. Product default is Daniel - Steady Broadcaster (`onwK4e9ZLuTAKqWW03F9`). |

**`.env` file:** Contains phantom tokens (`phm_...`), not real secrets. Safe to commit if tracked; real values are injected by `phantom exec` at runtime.

## Related

- [README.md](README.md) — production-oriented overview (local default; staging via Render)
- [ARCHITECTURE.md](ARCHITECTURE.md) — system topology (target vs as-built)
- [AGENTS.md](AGENTS.md) — agent baseline
- [docs/directory-readme-practice.md](docs/directory-readme-practice.md) — README conventions
