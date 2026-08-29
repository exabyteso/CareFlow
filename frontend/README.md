# Frontend (`frontend/`)

Installable Next.js 15 PWA for CareFlow: J8 voice-consent landing, care-seeker text path to recommend, and hospital desk shell. Talks to the FastAPI on port 8000 (`GET /health`, `/me`, `/facilities/recommend` — no `/v1` prefix). This is pretriage routing, not a diagnosis.

## Key files

| File | Role |
|------|------|
| `app/page.tsx` | Landing (`/`): J8 consent gate then role picker (no mic until Yes) |
| `app/voice-landing.tsx` | Client J8 greeting + Yes/No + role cards |
| `app/patient/page.tsx` | Care-seeker (`/patient`): disclaimer, 999, optional sign-in, symptoms, recommend (book disabled) |
| `app/hospital/page.tsx` | Hospital desk shell (`/hospital`): this facility only |
| `app/manifest.ts` | Web app manifest (`start_url` `/`, shortcuts `/patient` and `/hospital`) |
| `lib/auth.ts` | Firebase ID token + email/Google sign-in (P4/P5 import these) |
| `lib/api/client.ts` | `apiFetch` / `getApiBaseUrl` — Bearer + `{ error: { code, message } }` |
| `lib/api/patient.ts` | `getMe`, `recommendFacilities`, `mapSymptoms` (degrades if map is 404) |
| `lib/voice-consent.ts` | J8 consent in `localStorage` (does not start the microphone) |
| `lib/i18n.ts` | English / Kiswahili strings + persisted locale |
| `lib/ui.ts` | Shared card / button / input class recipes (`cf-teal`, `cf-emergency`) |
| `lib/firebase.ts` | Firebase Auth client (`careflow-kenya`; Google + email/password) |
| `components/app-shell.tsx` | Phone/desk width chrome; optional back-link label |
| `components/locale-toggle.tsx` | En/sw control (`document.documentElement.lang`) |
| `public/sw.js` | Online-only service worker (does not cache API / recommend) |
| `next.config.ts` | `output: 'standalone'` |

Dev: `cd frontend && npm install && npm run dev` (port 3000). Staging (Render) builds this app from the repo root via [`../build.sh`](../build.sh). Optional `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). Probe the API with `curl localhost:8000/health` → `{"status":"ok"}`. No vendor keys in the PWA. Full run order: [ONBOARDING.md](../ONBOARDING.md).

## Related

- [Repository root](../README.md)
- [ONBOARDING.md](../ONBOARDING.md)
- [../prototype/](../prototype/) — interactive hospital ticketing prototype (Vite)
- [docs/api/](../docs/api/) — HTTP chapters
