# Documentation — CareFlow

| Area | Path | Purpose |
|------|------|---------|
| System architecture | [../ARCHITECTURE.md](../ARCHITECTURE.md) | Target topology vs as-built ([PlantUML](../ARCHITECTURE.puml)) |
| Agent workflows | [agent-and-subagent-workflow.md](./agent-and-subagent-workflow.md) | Subagents, waves, runner/fixer |
| Mode SOPs | [agent-sops/](./agent-sops/) | Ask, Agent, Plan, Debug, [Alex PR auto-review](./agent-sops/alex-pr-review-automation.md) |
| API reference | [api/](./api/) | Human + agent HTTP chapters; Postman collection and environment JSON |
| OpenAPI | [../backend/openapi/openapi.yaml](../backend/openapi/openapi.yaml) | Committed spec; local Swagger UI at `http://localhost:8000/docs` |
| Testing | [testing-reference.md](./testing-reference.md) | Commands, pyramid, triage |
| Research / ADRs | [research/](./research/) | Decision records (ADRs) |
| Market research | [../research/](../research/) | Two-tier research workflow (`big-picture/` + `ops/`) |
| Plan conventions | [plan-conventions.md](./plan-conventions.md) | Wave plans in `~/.cursor/plans/` |
| Directory READMEs | [directory-readme-practice.md](./directory-readme-practice.md) | Top-level folder docs; nested READMEs by request only |
| Pre-design grill | [camlinedev.md](./camlinedev.md) | Problem, draft FRs/NFRs, open questions (`01`–`05`) |
| Product domain map | [product-map/](./product-map/README.md) | Two sides, queue vs booking, invariants |
| Investor pitch | [careflow-investor-pitch.pptx](./careflow-investor-pitch.pptx) | 11-slide investor deck (regenerate via `scripts/pitch`) |

## Adding docs

- **Runbooks / how-to** → `docs/` (this tree)
- **Architecture decisions** → `docs/research/` per [research/AGENTS.md](./research/AGENTS.md)
- **Competitive / vendor research** → `research/` per [research/AGENTS.md](../research/AGENTS.md)
- **Ephemeral plans** → `~/.cursor/plans/` (not committed)
- **Pre-design problem / FR / NFR grill** → [camlinedev.md](./camlinedev.md)
- **Top-level directory blurbs** → `<dir>/README.md` per [directory-readme-practice.md](./directory-readme-practice.md)
