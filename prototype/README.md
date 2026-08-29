# Prototype (`prototype/`)

Interactive hospital ticketing UI prototype: kiosk, patient app, queue board, and facility config. Runs locally with Vite + React + Tailwind.

## Key files

| File | Role |
|------|------|
| `prototype.jsx` | Main React component (`HospitalTicketingPrototype`) |
| `src/main.jsx` | Dev entry — mounts the prototype |
| `package.json` | Dependencies and scripts |
| `vite.config.js` | Vite + React plugin |

## Run locally

```bash
cd prototype
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## Related

- [../frontend/](../frontend/) — Next.js 15 PWA (role picker, care-seeker, hospital desk)
- [../plans/](../plans/) — product specs
- [Repository root](../README.md)
- [ONBOARDING.md](../ONBOARDING.md)
