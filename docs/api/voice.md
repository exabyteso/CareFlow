# Voice (STT / TTS)

In-app speech for care-seekers and staff (J8). **ElevenLabs first** for English/Kiswahili; **Pawa AI** for Kikuyu, Luo, Kamba, Meru, or when ElevenLabs fails. Vendor keys stay on the API — never in the PWA.

## Domain context

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/voice/stt` | Firebase Bearer (patient or staff) |
| `POST` | `/voice/tts` | Firebase Bearer (patient or staff) |

**Cascade:** one fallback per request; failure returns **502** `voice_provider_unavailable`. P3 calls these routes; booking must not depend on voice success.

| Need | First try | Fallback |
|------|-----------|----------|
| STT `en` / `sw` | ElevenLabs | Pawa |
| STT `ki` / `luo` / `kam` / `mer` / `kln` | Pawa | ElevenLabs |
| TTS `en` / `sw` | ElevenLabs | Pawa |
| TTS `ki` / `luo` / `kam` / `mer` / `kln` | Pawa | ElevenLabs |

## `POST /voice/stt`

- **Purpose** — Transcribe uploaded audio for symptom entry or UI prompts.
- **Request** — JSON `{ "audio_base64", "lang", "filename?" }` (base64 audio bytes).
- **Success** — `200` JSON: `{ "text", "provider": "elevenlabs"|"pawa", "lang" }`.
- **Errors** — `401`, `422` (empty audio), `502` (all providers failed).

## `POST /voice/tts`

- **Purpose** — Synthesize spoken UI copy.
- **Request** — JSON `{ "text", "lang" }`.
- **Success** — `200` `audio/mpeg` body; headers `X-Voice-Provider`, `X-Voice-Lang`.
- **Errors** — `401`, `422`, `502`.
- **ElevenLabs voice** — premade **Daniel - Steady Broadcaster** (`onwK4e9ZLuTAKqWW03F9`). Override only via `ELEVENLABS_VOICE_ID`; empty env falls back to Daniel.

## Implementation status snapshot (backend)

| Area | Status |
|------|--------|
| `backend/app/voice/` cascade + providers | **Implemented** |
| Hub `include_router(voice_router)` | **Handshake P1** |

## Reference files

- `backend/app/voice/router.py`
- `backend/app/voice/service.py`
- `backend/app/voice/cascade.py`
- `backend/app/voice/tests/`
