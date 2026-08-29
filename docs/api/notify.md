# Notify (SMS and reminder calls)

Outbound notifications for J1 (booking confirm SMS), J3 (no-show SMS), and J9 (reminder SMS + call). **`DEMO_NOTIFY=1`** logs instead of sending or dialling (CI must not live-dial).

## Domain context

Notify is primarily **service functions** called by other modules:

| Function | Caller | Journey |
|----------|--------|---------|
| `enqueue_booking_confirm(session, booking_id)` | P2 `POST /bookings` | J1 |
| `enqueue_no_show(session, booking_id)` | P4 no-show | J3 |
| `enqueue_reminder(session, booking_id)` | P5 scheduler / demo | J9 |

Rows persist in `notify_jobs` with `delivery_mode` `demo_log` or `live`.

**J9 voice routing:**

| Locale | Call channel | Provider |
|--------|--------------|----------|
| `en`, `sw` | `elevenlabs_call` | ElevenLabs + Twilio |
| `ki`, `luo`, `kam`, `mer`, `kln` | `twilio_play_pawa_audio` | Pawa TTS + Twilio play |

On failure: SMS still sent; call tries ElevenLabs then Pawa for `en`/`sw`; demo-logged when `DEMO_NOTIFY=1`. Never block booking.

## Env (names only)

`AFRICAS_TALKING_*`, `ELEVENLABS_*`, `TWILIO_*`, `PAWA_AI_API_KEY`, `DEMO_NOTIFY`.

## Implementation status snapshot (backend)

| Area | Status |
|------|--------|
| `backend/app/notify/service.py` | **Implemented** (demo_log + missing-key safe) |
| Live Twilio/ElevenLabs dial | **Queued placeholder** — logs when keys present |
| P2/P4 hooks | **Handshake** — import enqueue functions after their routes land |

## Reference files

- `backend/app/notify/service.py`
- `backend/app/notify/templates.py`
- `backend/app/notify/providers.py`
- `backend/app/notify/tests/`
