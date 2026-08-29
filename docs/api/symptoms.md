# Symptoms (map)

Journey **J1** (routine) and **J8** (spoken text after STT): map an utterance onto the Kenya catalog. This is **not** diagnosis. Embeddings pick `symptom_id`. **Rules** on those rows pick `keph_min` and `red_flag`. Vectors never pick the hospital.

## Domain context

`POST /symptoms/map` is the text (and later STT transcript) entry to pretriage. The care-seeker then calls [facilities.md](facilities.md) with the returned `keph_min` and `red_flag`.

**Base path:** `/symptoms` (no `/v1`). This chapter documents **`POST /map` only**.

**Authentication:** optional. Wave 1 is public (Bearer ignored), same as recommend.

| Method | Path | Auth | OpenAPI tag |
|--------|------|------|-------------|
| `POST` | `/symptoms/map` | None (optional Bearer ignored) | `symptoms` |

**Identifiers:** `symptom_id` is the catalog slug (`chest-pain`). `id` is the integer primary key.

**Query vs response casing:** JSON keys are snake_case (`symptom_id`, `keph_min`, `red_flag`).

**Side effects:** missing `symptoms` / `symptom_synonyms` rows are inserted from `backend/data/kenya-symptoms.json` (canonical rows plus Wave 1 hash vectors). Existing runtime catalog rows are not overwritten. No booking.

**Hub status:** the router lives in `backend/app/symptoms/router.py`. It is **not** mounted until P1 `include_router` (see [mosescodes/handshake-p1.md](../../mosescodes/handshake-p1.md)).

**Related surfaces** (other chapters):

| Route | Chapter |
|-------|---------|
| `GET /facilities/recommend` | [facilities.md](facilities.md) |
| `POST /bookings` | [bookings.md](bookings.md) (unmounted until P1) |
| `GET /health` | [health.md](health.md) |

See [conventions.md](conventions.md).

## Shared types

### `MapSymptomsRequest`

| JSON key | Type | Notes |
|----------|------|-------|
| `text` | string | Utterance or STT transcript. Trimmed. 1–2000 chars. |
| `lang` | string | `en`, `sw`, `ki`, `luo`, `kln`, or `kam`. |

### `SymptomMatchItem`

| JSON key | Type | Notes |
|----------|------|-------|
| `id` | integer | `symptoms.id` |
| `symptom_id` | string | Catalog slug |
| `score` | number | Cosine similarity 0–1, rounded to 4 decimals |
| `keph_min` | integer | KEPH floor on this catalog row (2–6) |
| `red_flag` | boolean | Catalog red flag on this row |

### `MapSymptomsResponse`

| JSON key | Type | Notes |
|----------|------|-------|
| `matches` | `SymptomMatchItem[]` | Above confidence floor 0.55, best score per slug, highest score first. May be empty. |
| `keph_min` | integer or null | `MAX` of matched `keph_min`, lifted to ≥4 if any red flag. `null` when matches is empty. |
| `red_flag` | boolean | True if any match is a red flag. False when matches is empty. |

No pagination envelope.

## `POST /symptoms/map`

- **Purpose** — Map typed or spoken text onto catalog symptoms and return the KEPH floor for recommend (J1 / J8).
- **Path parameters** — None.
- **Query parameters** — None. Unknown keys ignored.
- **Request body** — `application/json` `MapSymptomsRequest`.
- **Success response** — `200`:

```json
{
  "matches": [
    {
      "id": 1,
      "symptom_id": "chest-pain",
      "score": 1.0,
      "keph_min": 4,
      "red_flag": true
    }
  ],
  "keph_min": 4,
  "red_flag": true
}
```

Empty catalog hit:

```json
{ "matches": [], "keph_min": null, "red_flag": false }
```

- **Errors**

| HTTP | `error.code` | When |
|------|----------------|------|
| 422 | `validation_error` | Missing/empty `text`, or `lang` not in the synonym enum. |
| 503 | `embedding_model_mismatch` | Stored synonym `embedding_model` is not `careflow-hash-v1`. |

- **Behaviour notes**
  - Wave 1 embedder is `careflow-hash-v1` (exact folded phrase). Paraphrase quality waits for e5-small (Phase 4).
  - Search langs: utterance lang plus `en` and `sw`.
  - Floor 0.55 cosine similarity (`1 - (embedding <=> query)`).
  - Rules: `MAX(keph_min)` then red-flag lift to at least 4. Embeddings do not pick KEPH.
- **Try it**

  | Field | Value |
  |-------|-------|
  | `operationId` | `mapSymptoms` |
  | Postman request | Map symptoms |
  | Tag | `symptoms` |

  ```bash
  curl -s -X POST http://localhost:8000/symptoms/map \
    -H 'Content-Type: application/json' \
    -d '{"text":"chest pain","lang":"en"}'
  ```

  Returns 404 until P1 mounts the router.

## Stable error codes and messages

| Code / message | HTTP | When |
|----------------|------|-------|
| `validation_error` / lang must be one of … | 422 | Unknown `lang` |
| `validation_error` / text must be non-empty. | 422 | Whitespace-only text |
| `embedding_model_mismatch` / synonym embeddings do not match the API embedding model | 503 | Model mix after a future e5-small backfill without a matching API |

## Relationship to other domains

Pass `keph_min` and `red_flag` into `GET /facilities/recommend`. Do not re-derive KEPH in the PWA from embeddings.

STT is P5 (`POST /voice/stt`). This route consumes **text** only.

## Suggested view → API mapping

| Surface | Call |
|---------|------|
| Care-seeker typed symptoms | `POST /symptoms/map` then `GET /facilities/recommend?keph_min=&red_flag=` |
| Care-seeker spoken symptoms (after P5) | STT text → same map |

## Frontend notes

- Send `lang` from the UI locale or detected STT language, not a free string.
- Empty `matches` is a normal 200: ask the person to rephrase. Do not invent a KEPH floor.
- If `red_flag` is true, call recommend with `red_flag=true`.
- Wave 1 hash match is closest on **catalog phrases** (for example `chest pain`, `homa`). Do not expect Wikipedia-style paraphrase until e5-small.
- Online-only: do not cache map in the service worker.

## Implementation status snapshot (backend)

| Area | Status |
|------|--------|
| Catalog JSON + validators | **Implemented** |
| Hash synonym vectors + `POST /symptoms/map` handler | **Implemented** (package) |
| KEPH / red-flag rules (`app.triage`) | **Implemented** (no HTTP) |
| Mounted on `main.py` | **Not implemented** (P1 handshake) |
| `intfloat/multilingual-e5-small` | **Not implemented** (Phase 4) |

## Reference files

- Route: `backend/app/symptoms/router.py`
- Mapper: `backend/app/symptoms/mapper.py`
- Rules: `backend/app/triage/rules.py`
- Embeddings: `backend/app/symptoms/embeddings.py`
- Seed: `backend/app/symptoms/seed.py`
- Catalog: `backend/data/kenya-symptoms.json`
- Handshake: [mosescodes/handshake-p1.md](../../mosescodes/handshake-p1.md)
- Tests: `backend/app/symptoms/tests/`, `backend/app/triage/tests/`
