# Agent guide: `docs/api/` chapters

Instructions for **Cursor and other coding agents** that create or update files under `docs/api/`. Humans should read [README.md](README.md) for the route map and maintainer checklist; this file is the **authoring contract** for domain chapters.

**Machine-readable contract:** handler code, schema types, generated OpenAPI, and tests—not this prose or the human README.

**Precedence when sources disagree:** runtime handlers → generated OpenAPI → this prose.

**Stack paths:** routes in `backend/app/main.py` (includes `backend/app/core/health.py`, `backend/app/auth/router.py`, `backend/app/facilities/router.py`); schemas beside those routers; `OPENAPI_PATH=backend/openapi/openapi.yaml`. Export from `backend/`: `python -m app.export_openapi`. Interactive docs: [README.md](README.md).

**Reference standard:** Treat **[health.md](health.md)** as the canonical example of expected depth and section layout. New or refreshed chapters should match that level of detail unless the surface is genuinely trivial (one or two routes with no shared types, no pagination, and no cross-domain behaviour). When in doubt, prefer more detail.

## Audiences

When adding or refreshing API documentation under `docs/api/`, write for two audiences:

1. Frontend agents that need enough context to implement screens, API clients, validation, error handling, and loading states correctly.
2. Backend maintainers who need a human-readable companion to routes, handlers, OpenAPI, and integration tests.

Do not treat these docs as the machine-readable contract. Handler code, schema types, generated OpenAPI, and tests remain the source of truth. When they disagree: **runtime handlers → generated OpenAPI → this prose**.

## Chapter outline (required order)

Use this section order for every non-trivial domain chapter. Omit a section only when it truly does not apply, and say so in one line (for example "No write routes — no request-body types").

| # | Section | Required when |
|---|---------|----------------|
| 1 | `## Domain context` | Always |
| 2 | `## Shared types` | Any JSON request/response shape appears more than once or has non-obvious fields |
| 3 | One `## \`METHOD …\`` heading per route | Always (group sub-routes under a parent heading only if they share identical contracts) |
| 4 | `## Stable error codes and messages` | Any domain-specific or recurring errors beyond generic 401/500 |
| 5 | `## Relationship to …` | Behaviour spans another chapter |
| 6 | `## Suggested view → API mapping` | Frontend agents will build more than one screen |
| 7 | `## Frontend notes` | Always for non-trivial chapters |
| 8 | `## Implementation status snapshot (backend)` | Planned routes, stubs, or intentional gaps exist |
| 9 | `## Reference files` | Always |

## Expected structure

### 1. Domain context

Briefly explain what the endpoint group is for and how it fits into the product flow.

**Path and resource map** — when the domain uses multiple path shapes, list each base path with its verbs before documenting endpoints.

**Concept glossary** — use a table when the domain has non-obvious nouns or semantics.

Include explicitly:

- Base path (CareFlow has **no `/v1`**; paths are unprefixed — `/health`, `/me`, `/facilities/recommend`).
- **Authentication** — middleware/guard names, org/tenant scope rules, and a **scope or capability table** (`Method` | `Path` | `scope` / `capability`) when routes use fine-grained auth.
- Important lifecycle, state-machine, or replace semantics.
- **Money**, **time**, **file**, and **identifier** conventions that matter for this domain.
- **Query vs response casing** — call out snake_case query keys with camelCase JSON bodies when both appear.
- **Soft delete** — tombstone field and whether hard delete exists (when applicable).
- **Side effects** — cache invalidation, webhooks, async jobs, ledger debits, etc.
- **Related surfaces** — table linking routes documented in *other* chapters.
- Links to shared docs: [conventions.md](conventions.md), [pagination-sorting-and-query-keys.md](pagination-sorting-and-query-keys.md), and sibling domain chapters.

### 2. Shared types

Define reusable shapes **before** endpoint sections.

For **each** meaningful JSON object, add a `### \`TypeName\`` heading and a field table:

| JSON key | Type | Notes |
|----------|------|-------|
| … | … | Purpose, omitempty, server-set fields, frontend implications |

Also document wrapper shapes (`data` + `pagination` / `paging`) and whether list endpoints return **cursor**, **offset**, **always paginated**, or a **bare array/object**.

Prefer field tables. Do not summarise a complex response as "see OpenAPI" unless the chapter is intentionally shallow.

### 3. Document each endpoint separately

Use one heading per route:

```md
## `GET /health`
```

For each endpoint, include **every section that applies**, using these exact bold labels:

- **Purpose** — product behaviour in one or two sentences.
- **Path parameters** — name, type, validation.
- **Query parameters** — exact allowlist, per-key purpose, defaults, and unknown-key behaviour (rejected vs ignored).
- **Request body** — content type, schema name, required vs optional fields.
- **Success response** — status code and full shape, including wrappers.
- **Errors** — status codes, stable `error.code` values (or legacy `error` strings) from your error catalogue.
- **Behaviour notes** — side effects, sorting, server defaults, idempotency, immutability.

For list endpoints with filters, add a **query purpose table** (key → semantics).

For pagination, document inline and update [pagination-sorting-and-query-keys.md](pagination-sorting-and-query-keys.md) when list contracts change.

### 4. Stable error codes and messages

Add a chapter-level table consolidating domain errors:

| Code / message | HTTP | When |
|----------------|------|------|
| … | … | … |

### 5. Relationship to other domains

When this chapter's data or semantics overlap another area, explain alignment pitfalls and pointers.

### 6. Suggested view → API mapping

For domains with UI work, document **screens or workflows** as tables.

### 7. Frontend notes

End each non-trivial chapter with a **Frontend notes** bullet list.

### 8. Implementation status snapshot (backend)

When the domain has stubs or intentional API gaps:

| Area | Status |
|------|--------|
| … | **Implemented** / **Not implemented** / **Stub only** |

### 9. Reference files

Finish with implementation references:

- Route registration (`backend/app/main.py`)
- Handler file(s) under `backend/app/core/health.py`, `backend/app/auth/`, `backend/app/facilities/`
- Schemas beside those routers (Pydantic models in the same packages)
- Serializers (if separate from handlers)
- Models / persistence layer
- Integration tests under `backend/tests/`
- Committed OpenAPI (`OPENAPI_PATH=backend/openapi/openapi.yaml`)

## Behaviour OpenAPI does not explain well

Call out explicitly in **Domain context** or **Behaviour notes**:

- State transitions and side-effect timing (wallet debits, publish gates, etc.).
- Webhook idempotency and replay semantics.
- Auth scope vs role checks and **403** vs **404** membership behaviour.
- Cursor vs offset pagination differences per endpoint.
- Public vs authenticated route registration gates.
- Feature flags or "not available" stubs returned by handlers.

## Maintenance rules

When API behaviour changes, update the docs in the same PR if the change affects routes, query contracts, sort tokens, bodies, status codes, error codes, pagination semantics, soft-delete behaviour, or cross-domain relationships.

Before finalising docs, compare against:

1. `backend/app/main.py` and the included routers
2. Handler validation and schema types
3. Integration tests under `backend/tests/`
4. `backend/openapi/openapi.yaml` (`OPENAPI_PATH`; re-export with `python -m app.export_openapi` from `backend/`)

Do not hand-edit generated OpenAPI. Change handlers or Pydantic models, then re-export.

Use British English in prose; preserve implemented identifiers, JSON keys, route paths, and third-party strings exactly.

## Subagent orchestration (large or new API surfaces)

When the HTTP surface changes substantially—**a new domain chapter**, many new routes, or a wide refresh across handlers, types, pagination, and errors—**do not** try to finish all `docs/api/` work in the same agent thread that already implemented or reviewed the backend slice.

**Delegate documentation to a separate subagent** when any of the following apply:

- A **new API** or **new domain chapter** is being documented for the first time.
- The change set touches **many routes**, shared types, error tables, and cross-chapter links in one pass.
- The **parent session** is already at roughly **70% context usage**—hand off docs before quality drops; keep the parent comfortably below ~85% for merge synthesis and tests (see [agent-and-subagent-workflow.md](../agent-and-subagent-workflow.md)).

**Parent (orchestrator) responsibilities:**

- Own merge order, parity checklist, and when to run targeted tests.
- Launch doc subagents with **bounded** prompts: inputs (routes, handler paths, test files), expected deliverables (chapter sections, README route map row, pagination doc updates), **paths they own** (`docs/api/<chapter>.md`, `docs/api/README.md`, `docs/api/pagination-sorting-and-query-keys.md` as needed), and **paths they must not touch** (handler source, tests, generated OpenAPI—unless the brief explicitly includes contract fixes).

**Documentation subagent prompt should include:**

1. Read [README.md](README.md), this file, and [health.md](health.md).
2. Confirm routes in `backend/app/main.py` and read named handlers, schemas, and integration tests (readonly exploration is fine).
3. Draft or refresh the domain chapter to the chapter outline and quality bar above.
4. Update [README.md](README.md) route map and [pagination-sorting-and-query-keys.md](pagination-sorting-and-query-keys.md) when list contracts change.

**When not to spin out a subagent:** a single-route tweak, a small error-message change, or a one-section update in an existing chapter—the implementing agent can update docs inline in the same PR.

## Agent workflow checklist

When asked to write or update API documentation:

0. If the surface is large or new—or parent context is ~70% or higher—see **Subagent orchestration** above and delegate `docs/api/` work to a bounded documentation subagent.
1. Read [README.md](README.md) and this file.
2. Read [health.md](health.md) and mirror its section layout and table density.
3. Confirm routes exist and identify handler validation and schema types.
4. Add or update the route map row in [README.md](README.md) when the HTTP surface changes.
5. Draft or refresh the domain chapter using the chapter outline above.
6. Add or refresh **Stable error codes**, **Suggested view → API mapping**, and **Implementation status** when applicable.
7. Update [pagination-sorting-and-query-keys.md](pagination-sorting-and-query-keys.md) when list contracts or sort tokens change.
8. Cross-check handler code, schemas, integration tests, and OpenAPI before merge.

## Quality bar (self-check before merge)

A chapter meets the standard when a frontend agent can implement the feature **without reading handler source**, except for edge cases. Confirm:

- [ ] Domain context includes auth/scopes and money/time/id conventions where relevant.
- [ ] Every shared JSON type has a field table.
- [ ] Every route has Purpose, parameters, success shape, errors, and behaviour notes as applicable.
- [ ] List endpoints document allowlist, defaults, sort tokens, cursor scope, and response envelope shape.
- [ ] Query allowlist strictness is explicit (rejected vs ignored).
- [ ] Chapter-level error table exists when the domain has non-generic errors.
- [ ] View → API mapping and Frontend notes are present for UI-facing domains.
- [ ] Reference files list handlers, schemas, errors, and tests.
- [ ] Prose matches runtime behaviour verified against handlers and integration tests.

## Activate this workflow

- Enable the **`api-docs`** module at `cursor init`, or run `render.sh --modules api-docs` on an existing project.
- In Cursor, attach **`@.cursor/rules/docs-api-reference.mdc`** when authoring or refreshing `docs/api/` chapters.
