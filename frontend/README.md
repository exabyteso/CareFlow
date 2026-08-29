# Frontend (`frontend/`)

Installable Next.js 15 PWA for CareFlow: dual-audience marketing `/`, J8 voice consent on `/patient`, care-seeker booking path, and hospital desk shell. Talks to the FastAPI on port 8000 (`GET /health`, `/me`, `/facilities/recommend` — no `/v1` prefix). This is pretriage routing, not a diagnosis.

## Key files

| File | Role |
|------|------|
| `app/page.tsx` | Marketing home (`/`): dual CTAs in nav and footer (no consent gate) |
| `app/marketing-home.tsx` | Client marketing page (hero, how-it-works, care-seeker + hospital) |
| `components/marketing-role-ctas.tsx` | Shared “I need care” / “I work at a hospital” links |
| `components/voice-consent-card.tsx` | J8 Yes/No + spoken walkthrough (no mic until Yes) |
| `app/patient/page.tsx` | Care-seeker (`/patient`): J8 consent, then journey (symptoms, recommend, book) |
| `app/hospital/page.tsx` | Hospital desk shell (`/hospital`): this facility only |
| `app/manifest.ts` | Web app manifest (`start_url` `/`, shortcuts `/patient` and `/hospital`) |
| `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png` | Tab favicon, App Router icon, Apple touch icon |
| `public/icons/` | PWA / in-app mark (`icon-64.png`, `icon-192.png`, `icon-512.png`, `maskable-512.png`) plus cropped `hero.png` for compact brand |
| `public/illustrations/` | Marketing art (`hero.png`, `care-seeker.png`, `hospital.png`); sources in `SOURCES.md` |
| `components/brand-mark.tsx` | Infinity mark: compact chrome chip, or landing hero (centered, vw-sized) |
| `lib/auth.ts` | Firebase ID token + email/Google sign-in (P4/P5 import these) |
| `lib/api/client.ts` | `apiFetch` / `getApiBaseUrl` — Bearer + `{ error: { code, message } }` |
| `lib/api/patient.ts` | `getMe`, `recommendFacilities`, `mapSymptoms` (degrades if map is 404) |
| `lib/voice-consent.ts` | J8 consent in `localStorage` (does not start the microphone; asked on `/patient`) |
| `lib/i18n.ts` | English / Kiswahili strings + persisted locale |
| `lib/ui.ts` | Shared card / button / input class recipes (`cf-primary`, `cf-emergency`) |
| `lib/firebase.ts` | Firebase Auth client (`careflow-kenya`; Google + email/password) |
| `components/app-shell.tsx` | Phone/desk width chrome; optional care-seeker top bar + tabs |
| `components/patient-top-bar.tsx` | Sticky care-seeker bar: mark + CareFlow left, profile right |
| `components/icons.tsx` | Shared line-art SVG icons (emergency, pin, mic, tabs, etc.) |
| `components/patient-tab-bar.tsx` | Care-seeker fixed bottom tabs (Home / Care / Facilities) |
| `public/avatars/` | Demo care-seeker profile placeholder (`care-seeker-placeholder.png`) |
| `components/locale-toggle.tsx` | En/sw control (`document.documentElement.lang`) |
| `public/sw.js` | Online-only service worker (does not cache API / recommend) |
| `next.config.ts` | `output: 'standalone'` |

Dev: `cd frontend && npm install && npm run dev` (port 3000). Staging (Render) builds this app from the repo root via [`../build.sh`](../build.sh). Optional `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). Probe the API with `curl localhost:8000/health` → `{"status":"ok"}`. No vendor keys in the PWA. Full run order: [ONBOARDING.md](../ONBOARDING.md).

## Related

- [Repository root](../README.md)
- [ONBOARDING.md](../ONBOARDING.md)
- [../prototype/](../prototype/) — interactive hospital ticketing prototype (Vite)
- [docs/api/](../docs/api/) — HTTP chapters
