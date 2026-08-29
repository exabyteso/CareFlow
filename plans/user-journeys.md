# User journeys — Kenya pretriage PWA

Canonical journeys for humans and agents. Feature work **must** satisfy the journeys tagged on the matching issue in [team-issues.md](team-issues.md). Parallel people/subagents: [merge-clash-avoidance.md](merge-clash-avoidance.md). This is **not** a diagnosis product; UI copy always says pretriage routing.

Related: [kenya-pretriage.md](kenya-pretriage.md), [product-spec.md](product-spec.md).

## Actors

- **Care-seeker** — person (or family) on `/patient`. Kenyan `+254` phone. English and/or Kiswahili; may speak Gĩkũyũ, Dholuo, Kalenjin, Kikamba. May be **blind or low-vision** — voice path (J8) is required, not optional polish.
- **Hospital clinician** — nurse or doctor at one facility using `/hospital`. Marks arrived / no-show; writes notes (text, voice, photo).
- **Hospital desk** — same PWA and login as clinician in MVP (no separate admin role). Updates **people waiting**.
- **SMS + voice call** — Africa’s Talking SMS and a phone reminder. **ElevenLabs** outbound for English/Kiswahili. **Pawa AI** STT/TTS when ElevenLabs lacks Kikuyu, Luo, Kamba, or Meru, or when ElevenLabs errors. Pawa does not place the PSTN call.
- **Tester (T)** — walks J1–J9 in E2E, including voice-consent and reminder-call demo log.

## J1 — Care-seeker, routine (happy path)

1. Opens the PWA (browser or installed). On `/`, chooses **I need care** (nav or footer). Completes J8 voice prompt on `/patient`. Signs in with Firebase (optional for guest book).
2. Sees disclaimer: not a diagnosis; in emergency call 999 / go now.
3. Completes structured symptom form **or speaks symptoms** (mapped to catalog). Optional extra text stored.
4. Rules assign a **minimum KEPH level** (no red flag).
5. App uses location (GPS or typed Kenyan place). API returns facilities at that level or above, ranked **lowest wait**, then **nearest**.
6. Care-seeker **books** one facility. Sees reference, name, KEPH level, map link, wait count.
7. SMS: booking confirmed (or demo console). J9 may schedule a reminder call.
8. Goes to the facility. Clinician marks **met**. Wait count decrements. Journey ends (notes optional).

## J2 — Care-seeker, red flag

1. Same as J1 through the form or voice symptoms.
2. Red flags (chest pain, severe bleeding, stroke signs, trouble breathing) **skip wait ranking**.
3. App shows **nearest KEPH 4+**, 999, “go now”. Booking still allowed so the hospital sees them coming.
4. Must not recommend a quieter distant Level 2.

## J3 — Care-seeker, no-show

1. Completes J1 through booking + SMS confirm.
2. Does not arrive. Clinician marks **did not come**.
3. Wait count decrements. SMS: you were marked as not arrived; rebook if still needed.

## J4 — Hospital desk, wait count

1. Staff opens PWA, chooses **Hospital**, signs in. Session is scoped to **one seeded facility**.
2. Sees current **people waiting**. Updates the number (this is what ranking uses).
3. Must not see other facilities’ queues.

## J5 — Hospital clinician, mark met / not come

1. After J4 (or same session), sees today’s bookings: name/phone last-4, symptoms summary, status `booked`.
2. When the person is in front of them: **mark as met**. Status `arrived`. Optional: add notes (J6).
3. If they never came: **did not come**. Status `no_show`. Triggers J3 SMS.
4. Queue only lists this facility.

## J6 — Hospital clinician, notes

1. Opens a booking (usually after met).
2. Adds **text**, and/or **voice** (browser speech → text), and/or **photo** of notes/prescription (stored + OCR text).
3. Another clinician at the same facility can read the note. Patients do not see clinical notes in MVP.

## J7 — First-boot recommend (baseline)

1. Care-seeker (even without Firebase in baseline) opens `/patient`.
2. Stub `GET /facilities/recommend` returns the **committed Kenya seed** ranked by wait then distance.
3. Proves the loop before live KMHFR or auth.

## J8 — Care-seeker, voice / low vision (required)

1. Lands on marketing `/`. Chooses **I need care** (navbar or footer). On `/patient`, **before** the care-seeker journey, the PWA **asks if they want voice features on**. Microphone starts **only after yes** (button or “ndiyo” / “yes”). Returning visitors with consent in `localStorage` skip the prompt.
2. If yes: disclaimer, symptoms, results, and confirm-book are spoken and listen for answers. User can **say symptoms** in Kiswahili, English, Gĩkũyũ, Dholuo, Kikamba, or Kĩmĩĩrũ; STT uses ElevenLabs/Web Speech for en/sw and **Pawa** for the others (or if ElevenLabs fails). Backend maps text to catalog (`pgvector`) then rules → KEPH → nearest + lowest wait.
3. If no: visual form remains fully usable (keyboard + screen-reader labels still required).
4. Installed PWA must allow J1 without sighted assistance when voice is on.

## J9 — Appointment reminder phone call

1. After booking, at a lead time (e.g. T−2h), P5 places a reminder call to `+254` (Twilio). **ElevenLabs agent** for `en`/`sw`. If the booking locale is Kikuyu/Luo/Kamba/Meru **or ElevenLabs fails**, generate **Pawa TTS** and play it on the call (or SMS-only).
2. SMS still sent. Call is additional.
3. Demo mode logs the script and which provider would have been used; do not autodial random numbers.

## Out of journey

SHA claims, ambulance dispatch, pharmacy e-script networks, AfyaLink clinician-to-clinician referral, inbound IVR to book.
