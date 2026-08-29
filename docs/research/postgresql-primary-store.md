# Primary store: PostgreSQL + pgvector

## Status

- **Outcome:** Accepted
- **Date:** 2026-08-28
- **Scope:** CareFlow product database (users, facilities cache, bookings, wait counts, notes, symptom catalog + embeddings). Not Firebase Auth. Not object storage for note images.

## Context

CareFlow is a Kenya-only pretriage PWA: map symptoms to a KEPH level, recommend nearest + shortest wait, book, then let hospital staff mark arrived/no-show and add notes.

The domain is already specified in [plans/product-spec.md](../../plans/product-spec.md): `Facility`, `User`, `Booking` (create increments `wait_count`; arrived/no-show decrements), `Note`, `Symptom` + synonyms with embeddings. Facilities are ~17k KMHFR rows. The symptom catalog is ~100–200 canonical rows. Registered users may eventually approach Kenya-scale (~50 million rows).

A six-person hackathon MVP needs a **free, easy local setup**. The schema will grow. [plans/kenya-pretriage.md](../../plans/kenya-pretriage.md) already named PostgreSQL + pgvector in the stack list; this record locks that choice against MongoDB, Cassandra, and other “massive scale” engines so later planning cannot reopen it without an explicit supersede.

## Options considered

### Option A: PostgreSQL + pgvector (one primary)

1. Run Postgres with pgvector in `docker-compose` beside FastAPI.
2. Model domain tables with Alembic; `BIGINT` primary keys from day one.
3. Rank facilities with SQL (KEPH filter, `wait_count`, distance). Map symptoms with pgvector in the same database.
4. Wrap booking create + `wait_count` increment in one transaction.
5. Scale later: managed Postgres → replicas / PgBouncer → partition bookings → Citus only if a primary cannot take writes.

**Pros**

- Matches the relational domain and the atomic wait-count rule.
- Geo ranking and embeddings stay in one engine (no Pinecone/Weaviate for MVP).
- Schema change is ordinary SQL migrations — the stated future of this product.
- MVP is local compose, $0.
- Proven path past tens of millions of users (replicas, then partition/shard) without changing query language.

**Cons**

- A single primary is not linearly scalable like a Cassandra ring.
- Render’s free Postgres expires in 30 days (compose/Neon are the durable free paths).
- Horizontal write scale, if ever needed, is an operational project (partition or Citus).

### Option B: MongoDB (Atlas)

1. Store documents per user/booking/facility on Atlas (M0 free tier for MVP).
2. Use multi-document transactions for booking + wait_count.
3. Rank with `$geoNear` plus application logic; add Atlas Vector Search later (not on M0).

**Pros**

- Atlas M0 is free-forever and easy to stand up.
- Adding fields does not require a migration in the SQL sense.

**Cons**

- Domain objects are already specified; document flexibility is unused.
- Wait-count integrity and join-shaped ranking fight the document model.
- Symptom vectors would be a second product (Atlas Search), not the locked pgvector catalog.
- M0: 512 MB, ~100 ops/s, no backups — a demo cluster, not a scale story.

### Option C: Cassandra / Astra / Scylla

1. Model one table per access pattern (recommend, queue, wait by facility).
2. Use a managed Cassandra (Astra credits) or run a cluster.
3. Backfill new tables whenever a query shape changes.

**Pros**

- Linear write scale and multi-DC availability for append-heavy, partition-key workloads.

**Cons**

- CareFlow is transactional OLTP with evolving queries, not a write firehose.
- New access pattern = new table + backfill; primary keys cannot be altered in place.
- Booking + `wait_count` cannot be one ACID transaction.
- Cluster ops (or Astra hibernation when credits run out) is the opposite of an easy MVP.
- No native answer for geo ranking + pgvector-style catalog search.

### Option D: CockroachDB (or Spanner-class distributed SQL)

1. Keep SQL and transactions; spread writes across nodes from day one.

**Pros**

- Horizontal SQL without abandoning ACID or migrations.

**Cons**

- Harder and costlier than Postgres for a six-person MVP.
- Weaker pgvector / PostGIS story than Postgres.
- Solves a ceiling this product has not measured.

### Option E: Cloud Firestore (next to Firebase Auth)

1. Put product documents in Firestore because identity is already Firebase.

**Pros**

- Fast to wire beside existing Firebase ID tokens.

**Cons**

- Weak geo ranking and no pgvector.
- Per-operation billing at tens of millions of user documents.
- Wait-count increment across a booking is a painful transaction pattern.
- Firebase stays the **auth** layer only.

## Decision

Choose **Option A**.

PostgreSQL with pgvector is the **only** product datastore. MVP runs it in Docker Compose. Production uses managed Postgres (Neon, paid Render, or equivalent). Symptom embeddings stay in Postgres — no separate vector DB for MVP.

**Non-goals**

- MongoDB, Cassandra/Astra/Scylla, CockroachDB, or Firestore as the product store.
- Pinecone, Weaviate, or Atlas Vector Search for the symptom catalog.
- Multi-region write topology at MVP.
- Replacing Firebase Auth.

## Why Option A Was Chosen

- [plans/product-spec.md](../../plans/product-spec.md) requires an atomic booking/`wait_count` update and ranking by KEPH, wait, then distance — native SQL + a transaction.
- The symptom engine is a small Kenya catalog with embeddings; [plans/kenya-pretriage.md](../../plans/kenya-pretriage.md) already forbids a foreign vector DB for MVP.
- ~17k facilities and ~200 symptoms are not a Cassandra-shaped dataset. ~50 million users is a **row-count** problem (indexes, later partition of bookings), not millions of writes per second.
- P1’s baseline is compose + Alembic + `DATABASE_URL`. Switching engines would split the six-person path ownership for no workload reason.
- Schema will change; Postgres migrations are the cheapest evolution path of the options considered.

## Consequences

### Positive

- One `DATABASE_URL`, one migration tool, one ranking query language.
- Agents treat MongoDB/Cassandra pitches as out of scope unless this ADR is superseded.
- Scale work is additive (replicas, cache of `wait_count`, booking partitions) instead of a rewrite.

### Trade-offs

- Must operate Postgres (compose locally; managed in production). Render free Postgres is a 30-day trial, not a long-term home.
- If booking writes ever exceed one primary, the team partitions or adopts Citus — still SQL, still this ADR’s engine family.
- Notes image bytes belong in object storage later; Postgres holds URLs and OCR text only.

## Validation strategy

When backend code lands (P1):

1. Compose brings up Postgres with pgvector; `GET /health` succeeds against it.
2. Alembic creates `users`, `facilities`, `bookings`, `symptoms` / synonyms with a vector column.
3. A booking-create test (or transaction integration test) proves `wait_count` increments atomically with the booking row.
4. Recommend query filters `keph_level` and orders wait then distance without an application-side full scan of a second store.
5. `POST /symptoms/map` reads embeddings from Postgres, not an external vector product.

Until those exist, the lock is documentary: do not add a second product database to compose or Render.

## Related files

- [plans/kenya-pretriage.md](../../plans/kenya-pretriage.md)
- [plans/product-spec.md](../../plans/product-spec.md)
- [research/decision-log.md](../../research/decision-log.md)
- [AGENTS.md](../../AGENTS.md)
- [backend/README.md](../../backend/README.md)
