# Operations research index

**Last updated:** 2026-08-28

One-line summaries and **current recommendations**. Superseded paths are noted — check [`../decision-log.md`](../decision-log.md) before reversing a decision.

| Project | Status | Recommendation (as of index date) | Key deliverable |
|---------|--------|-----------------------------------|-----------------|
| Primary datastore (no ops folder; ADR-only) | **locked** | PostgreSQL + pgvector. Reject MongoDB, Cassandra, CockroachDB, Firestore as product store. | [D-001](../decision-log.md), [docs/research/postgresql-primary-store.md](../../docs/research/postgresql-primary-store.md) |

## Dependency graph (read order for new platform work)

```
plans/kenya-pretriage.md + product-spec.md
        → D-001 PostgreSQL + pgvector (docs/research/postgresql-primary-store.md)
```

## Backlog cross-walk

*(optional — link standalone backlog or traceability deliverables here)*
