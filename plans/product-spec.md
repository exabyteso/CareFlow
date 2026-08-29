# Product spec — CareFlow (Kenya pretriage)

Domain objects and HTTP stubs teammates implement against. Journeys: [user-journeys.md](user-journeys.md). Epic: [kenya-pretriage.md](kenya-pretriage.md).

## Product

**CareFlow** is a Kenya-only hospital **pretriage** PWA: map symptoms (text or voice, English/Kiswahili + Kenyan-language synonyms) to a KEPH level, recommend the nearest facility with the lowest hospital-reported wait, book, then let hospital staff mark arrived/no-show and add notes. Reminders: SMS + phone call (ElevenLabs; **Pawa AI** TTS/STT when ElevenLabs lacks the language or the API fails).

Not a diagnosis. Not SHA/AfyaKE.

## PWA routes

| Path | Role |
|------|------|
| `/` | Marketing homepage; role CTAs in nav and footer (`/patient`, `/hospital`) |
| `/patient` | Care-seeker: J8 voice consent, then disclaimer, symptoms, recommend, book |
| `/hospital` | Desk + clinician: wait count, queue, mark met/no-show |
| `/hospital/notes` | P5 — notes capture for a booking |

Manifest: `start_url` `/`, `display: standalone`, shortcuts to `/patient` and `/hospital`. One origin, one service worker.

## Domain

Physical tables, enums, indexes, and `wait_count` transactions: [product-schema.md](product-schema.md).

**Facility** — `kmhfr_code`, `name`, `keph_level` (2–6), `lat`, `lng`, `county`, `operational`, `wait_count`, `source`, `synced_at`. Kenya only. Drop null coordinates.

**Symptom** — `id` (slug), `keph_min`, `red_flag`, optional `icd11_uri` / CIEL id. Synonyms: `lang` in `en`, `sw`, `ki`, `luo`, `kln`, `kam` + embedding in pgvector.

**User** — `firebase_uid`, `role` (`patient` | `hospital_staff`), `facility_id` (staff only), `locale` (`en` | `sw`), `phone_e164`.

**Booking** — `id`, `facility_id`, `patient_uid`, `symptom_ids`, `status` (`booked` | `arrived` | `no_show` | `cancelled`), `locale`, timestamps. Create increments `wait_count`; arrived/no-show decrements.

**Note** — `booking_id`, `author_uid`, `text`, `audio_transcript`, `image_urls`, `ocr_text`. Staff of that facility only.

**Notify job** — channel `sms` | `elevenlabs_call` | `twilio_play_pawa_audio`, template `booking_confirm` | `reminder` | `no_show`, `locale`, `voice_provider` (`elevenlabs` | `pawa`), demo-log vs live.

## API stubs (OpenAPI later under `docs/api/`)

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/health` | none | Baseline |
| GET | `/me` | Firebase | P1 |
| GET | `/facilities/recommend?lat=&lng=&keph_min=` | optional in baseline | Rank wait then distance. Seed if empty. |
| POST | `/symptoms/map` | patient | `{ "text", "lang" }` → `symptom_id[]` + scores |
| POST | `/voice/stt` | patient/staff | Audio → text. Cascade: ElevenLabs (en/sw) else **Pawa** (Kikuyu/Luo/Kamba/Meru/sw/en). |
| POST | `/voice/tts` | patient/staff | Text → audio. ElevenLabs first for en/sw; **Pawa** if that fails or lang is Kikuyu/Luo/Kamba/Meru. |
| POST | `/bookings` | patient | Create; increment wait |
| GET | `/hospital/queue` | staff | Own facility only |
| PATCH | `/hospital/wait-count` | staff | J4 |
| POST | `/hospital/bookings/{id}/arrived` | staff | J5 |
| POST | `/hospital/bookings/{id}/no-show` | staff | J5 + J3 notify |
| POST | `/hospital/bookings/{id}/notes` | staff | J6 |

Ranking: filter `keph_level >= keph_min` (L5 may take an L4 case). Red flag: ignore wait, nearest KEPH 4+.

## Seed (first boot)

Committed JSON of a few Nairobi facilities with `keph_level`, lat/lng, demo `wait_count`. Compose loads on empty table. Wait counts stay demo until staff update them.

## Env (names only)

`DATABASE_URL`, `FIREBASE_*`, `AFRICAS_TALKING_*`, `ELEVENLABS_*`, `TWILIO_*` or ElevenLabs phone IDs, `PAWA_AI_API_KEY` ([api.pawa-ai.com](https://api.pawa-ai.com/v1)), `DEMO_NOTIFY=1`, `NEXT_PUBLIC_API_URL`. Phantom locally; never commit values.
