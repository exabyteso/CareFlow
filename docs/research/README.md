# Research / architecture decision records

Decision records for options considered, trade-offs, and **why** a direction was chosen.

**Authoring contract for agents:** [AGENTS.md](./AGENTS.md)

## When to add a doc

- Comparing architectural or schema options
- Recording why an option was chosen and what was rejected
- Preserving spike findings for future implementers

## When not to add here

- API route reference → `docs/api/` (if applicable)
- Runbooks / env tables → `docs/`
- Ephemeral plans → `~/.cursor/plans/`

## Filename

- kebab-case: `import-dedupe-strategy.md`
- Archive: prefix `archive-` when historical only

## Records

| File | Outcome | Locks |
|------|---------|-------|
| [postgresql-primary-store.md](postgresql-primary-store.md) | Accepted 2026-08-28 | [D-001](../research/decision-log.md) — PostgreSQL + pgvector |
