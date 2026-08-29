# Scripts (`scripts/`)

Operational scripts invoked from the repository root. Add a table row when you add a script.

| Script | Purpose |
|--------|---------|
| `pdf/render-html.sh` | HTML → PDF (Playwright) |
| `pdf/render-markdown.sh` | Markdown → PDF (Pandoc chain) |
| `pdf/render-svg.sh` | SVG → PDF (landscape option) |
| `pdf/smoke-test.sh` | Local PDF pipeline verification |
| `pitch/generate-investor-deck.js` | Regenerates [docs/careflow-investor-pitch.pptx](../docs/careflow-investor-pitch.pptx) (`cd scripts/pitch && npm install && npm run generate`) |

## Related

- [ONBOARDING.md](../ONBOARDING.md) — first-run setup
- [Repository root](../README.md)
- [docs/directory-readme-practice.md](../docs/directory-readme-practice.md)
