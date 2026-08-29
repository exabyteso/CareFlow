# Plans (`plans/`)

Committed planning artifacts: team handoff, **product/codebase specification**, implementation specs, and wave deliverables. Ephemeral Cursor orchestration plans live in `~/.cursor/plans/` (not committed).

Until the spec exists, add it here (for example `plans/product-spec.md`) and link it from the root README.

## Key files

| File | Role |
|------|------|
| [`product-spec.md`](./product-spec.md) | Domain objects and HTTP stubs |
| [`product-schema.md`](./product-schema.md) | PostgreSQL + pgvector product schema (P1 Alembic source) |
| [`user-journeys.md`](./user-journeys.md) | Canonical journeys J1–J9 |
| [`kenya-pretriage.md`](./kenya-pretriage.md) | Feature plan and P1–P5 / T split |
| [`team-issues.md`](./team-issues.md) | Issue bodies if GitHub issues are missing (paste-ready parent prompts) |
| [`merge-clash-avoidance.md`](./merge-clash-avoidance.md) | Hub owners, handshake, wave gate — attach in every write session |
| [`wave-plan.template.md`](./wave-plan.template.md) | Subagent wave plan — copy to `~/.cursor/plans/<feature>.plan.md` |

## Related

- [docs/plan-conventions.md](../docs/plan-conventions.md) — wave naming and ownership
- [Repository root](../README.md)
- [ONBOARDING.md](../ONBOARDING.md)
