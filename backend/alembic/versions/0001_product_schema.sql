-- CareFlow product schema — Alembic revision source (Postgres 16)
-- Constants: SYMPTOM_EMBEDDING_DIM = 384
--            SYMPTOM_EMBEDDING_MODEL = 'intfloat/multilingual-e5-small'

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM ('patient', 'hospital_staff');
CREATE TYPE ui_locale AS ENUM ('en', 'sw');
CREATE TYPE synonym_lang AS ENUM ('en', 'sw', 'ki', 'luo', 'kln', 'kam');
-- mer = Kĩmĩĩrũ / Meru (Pawa notify); not a symptom-synonym lang in MVP
CREATE TYPE notify_locale AS ENUM ('en', 'sw', 'ki', 'luo', 'kln', 'kam', 'mer');
CREATE TYPE booking_kind AS ENUM ('instant', 'appointment');
-- prepaid_partner: whiteboard only; no payments/claims tables
CREATE TYPE booking_channel AS ENUM (
  'ranked_recommend',
  'preferred_search',
  'prepaid_partner'
);
CREATE TYPE booking_status AS ENUM ('booked', 'arrived', 'no_show', 'cancelled');
CREATE TYPE facility_source AS ENUM ('seed', 'kmhfr');
CREATE TYPE id_document_type AS ENUM (
  'kenyan_national_id',
  'alien_id',
  'passport'
);
CREATE TYPE notify_channel AS ENUM (
  'sms',
  'elevenlabs_call',
  'twilio_play_pawa_audio'
);
CREATE TYPE notify_template AS ENUM ('booking_confirm', 'reminder', 'no_show');
CREATE TYPE voice_provider AS ENUM ('elevenlabs', 'pawa');
CREATE TYPE notify_delivery_mode AS ENUM ('demo_log', 'live');
CREATE TYPE notify_job_status AS ENUM (
  'pending',
  'sent',
  'failed',
  'demo_logged',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Facilities (KMHFR cache + committed Nairobi seed)
-- Seed load: application INSERT when the table is empty (J7). Not a DB trigger.
-- ---------------------------------------------------------------------------

CREATE TABLE facilities (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kmhfr_code    TEXT NOT NULL,
  name          TEXT NOT NULL,
  keph_level    SMALLINT NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  county        TEXT NOT NULL,
  operational   BOOLEAN NOT NULL DEFAULT TRUE,
  wait_count    INTEGER NOT NULL DEFAULT 0,
  source        facility_source NOT NULL,
  synced_at     TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT facilities_kmhfr_code_unique UNIQUE (kmhfr_code),
  CONSTRAINT facilities_keph_level_chk CHECK (keph_level BETWEEN 2 AND 6),
  CONSTRAINT facilities_wait_count_nonneg CHECK (wait_count >= 0),
  CONSTRAINT facilities_kenya_bbox_chk CHECK (
    lat BETWEEN -5.0 AND 5.6
    AND lng BETWEEN 33.5 AND 42.2
  )
);

COMMENT ON TABLE facilities IS
  'Kenya KMHFR cache (SoT) plus committed seed. Drop null coordinates at ingest. Esri is not a row source.';
COMMENT ON COLUMN facilities.wait_count IS
  'Desk-reported ranking signal (J4). Instant book +1; arrived/no_show/cancel -1 in the same txn. Not queue position. Drift vs COUNT(*) of bookings is allowed; never negative.';

CREATE INDEX facilities_recommend_idx
  ON facilities (keph_level, wait_count)
  WHERE operational;

-- earthdistance GiST: nearest after wait (red-flag: order distance only, keph_level >= 4)
CREATE INDEX facilities_earth_gix
  ON facilities
  USING gist (ll_to_earth(lat, lng))
  WHERE operational;

CREATE TRIGGER facilities_set_updated_at
  BEFORE UPDATE ON facilities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Departments (whiteboard; MVP bookings leave department_id NULL)
-- ---------------------------------------------------------------------------

CREATE TABLE departments (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  facility_id BIGINT NOT NULL REFERENCES facilities (id) ON DELETE RESTRICT,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT departments_facility_slug_unique UNIQUE (facility_id, slug),
  CONSTRAINT departments_id_facility_unique UNIQUE (id, facility_id)
);

COMMENT ON TABLE departments IS
  'Facility-scoped catalog (Dentist, Oncology, …). Bookings may reference; MVP does not require a row.';

-- ---------------------------------------------------------------------------
-- Users (auth-thin) + patient_profiles (whiteboard PII)
-- ---------------------------------------------------------------------------

CREATE TABLE users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  firebase_uid  TEXT NOT NULL,
  role          user_role NOT NULL,
  facility_id   BIGINT REFERENCES facilities (id) ON DELETE RESTRICT,
  ui_locale     ui_locale NOT NULL DEFAULT 'en',
  phone_e164    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_firebase_uid_unique UNIQUE (firebase_uid),
  CONSTRAINT users_phone_e164_unique UNIQUE (phone_e164),
  CONSTRAINT users_phone_ke_mobile_chk CHECK (phone_e164 ~ '^\+254[17][0-9]{8}$'),
  CONSTRAINT users_staff_facility_chk CHECK (
    (role = 'patient' AND facility_id IS NULL)
    OR (role = 'hospital_staff' AND facility_id IS NOT NULL)
  )
);

COMMENT ON TABLE users IS
  'Firebase auth projection. No legal name / ID here. No separate admin role (desk = clinician login).';

CREATE INDEX users_staff_facility_idx
  ON users (facility_id)
  WHERE role = 'hospital_staff';

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE patient_profiles (
  user_id               BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE RESTRICT,
  given_name            TEXT,
  family_name           TEXT,
  date_of_birth         DATE,
  nationality_iso2      CHAR(2),
  home_place_label      TEXT,
  home_lat              DOUBLE PRECISION,
  home_lng              DOUBLE PRECISION,
  id_document_type      id_document_type,
  id_number_last4       TEXT,
  id_number_hmac        BYTEA,
  id_hmac_key_version   SMALLINT,
  id_number_ciphertext  BYTEA,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT patient_profiles_nationality_chk CHECK (
    nationality_iso2 IS NULL OR nationality_iso2 ~ '^[A-Z]{2}$'
  ),
  CONSTRAINT patient_profiles_home_bbox_chk CHECK (
    (home_lat IS NULL AND home_lng IS NULL)
    OR (
      home_lat BETWEEN -5.0 AND 5.6
      AND home_lng BETWEEN 33.5 AND 42.2
    )
  ),
  CONSTRAINT patient_profiles_id_bundle_chk CHECK (
    (
      id_document_type IS NULL
      AND id_number_last4 IS NULL
      AND id_number_hmac IS NULL
      AND id_hmac_key_version IS NULL
    )
    OR (
      id_document_type IS NOT NULL
      AND id_number_last4 IS NOT NULL
      AND id_number_hmac IS NOT NULL
      AND id_hmac_key_version IS NOT NULL
    )
  ),
  CONSTRAINT patient_profiles_id_last4_chk CHECK (
    id_number_last4 IS NULL OR id_number_last4 ~ '^[A-Za-z0-9]{4}$'
  )
);

CREATE UNIQUE INDEX patient_profiles_id_hmac_unique
  ON patient_profiles (id_document_type, id_number_hmac)
  WHERE id_number_hmac IS NOT NULL;

COMMENT ON TABLE patient_profiles IS
  'Care-seeker PII (Photo A #1). 1:1 with patient users. Recommend GPS is request-time, not this home location.';
COMMENT ON COLUMN patient_profiles.id_number_hmac IS
  'SENSITIVE. HMAC-SHA256 of normalized ID with key from Phantom (not stored in DB). Never log. J5 displays name + phone last-4, not this.';
COMMENT ON COLUMN patient_profiles.id_number_last4 IS
  'SENSITIVE-lite. Queue may use phone last-4 instead (J5). Do not log.';
COMMENT ON COLUMN patient_profiles.id_number_ciphertext IS
  'SENSITIVE. Optional app-level envelope of the full ID. NULL in MVP. Never log. Bytes not a text blob.';

CREATE TRIGGER patient_profiles_set_updated_at
  BEFORE UPDATE ON patient_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION trg_patient_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = NEW.user_id AND u.role = 'patient'
  ) THEN
    RAISE EXCEPTION 'patient_profiles.user_id % must be role=patient', NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER patient_profiles_role_chk
  BEFORE INSERT OR UPDATE OF user_id ON patient_profiles
  FOR EACH ROW EXECUTE FUNCTION trg_patient_profile_role();

-- Whiteboard path 1: preferred hospital. Empty in MVP.
CREATE TABLE user_preferred_facilities (
  user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  facility_id BIGINT NOT NULL REFERENCES facilities (id) ON DELETE RESTRICT,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, facility_id)
);

-- ---------------------------------------------------------------------------
-- Symptom catalog + synonyms / embeddings
-- ---------------------------------------------------------------------------

CREATE TABLE symptoms (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug           TEXT NOT NULL,
  keph_min       SMALLINT NOT NULL,
  red_flag       BOOLEAN NOT NULL DEFAULT FALSE,
  icd11_uri      TEXT,
  ciel_concept_id TEXT,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT symptoms_slug_unique UNIQUE (slug),
  CONSTRAINT symptoms_keph_min_chk CHECK (keph_min BETWEEN 2 AND 6),
  CONSTRAINT symptoms_red_flag_keph_chk CHECK (NOT red_flag OR keph_min >= 4)
);

COMMENT ON TABLE symptoms IS
  'Canonical pretriage catalog (~100–200). Rules pick KEPH from these rows; vectors never pick the hospital.';

CREATE TRIGGER symptoms_set_updated_at
  BEFORE UPDATE ON symptoms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE symptom_synonyms (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  symptom_id      BIGINT NOT NULL REFERENCES symptoms (id) ON DELETE RESTRICT,
  lang            synonym_lang NOT NULL,
  phrase          TEXT NOT NULL,
  embedding       vector(384) NOT NULL,
  embedding_model TEXT NOT NULL,
  embedded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT symptom_synonyms_phrase_unique UNIQUE (symptom_id, lang, phrase)
);

COMMENT ON COLUMN symptom_synonyms.embedding IS
  'SYMPTOM_EMBEDDING_DIM=384. Store L2-normalized vectors for model SYMPTOM_EMBEDDING_MODEL.';
COMMENT ON COLUMN symptom_synonyms.embedding_model IS
  'Must match app config (default intfloat/multilingual-e5-small). Mismatch → refuse /symptoms/map.';

CREATE INDEX symptom_synonyms_embedding_hnsw
  ON symptom_synonyms
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX symptom_synonyms_symptom_lang_idx
  ON symptom_synonyms (symptom_id, lang);

-- ---------------------------------------------------------------------------
-- Bookings (supertype) + subtypes
-- ---------------------------------------------------------------------------

CREATE TABLE bookings (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  facility_id         BIGINT NOT NULL REFERENCES facilities (id) ON DELETE RESTRICT,
  patient_user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  department_id       BIGINT,
  booking_kind        booking_kind NOT NULL,
  booking_channel     booking_channel NOT NULL,
  status              booking_status NOT NULL DEFAULT 'booked',
  notify_locale       notify_locale NOT NULL,
  keph_min_applied    SMALLINT NOT NULL,
  red_flag_applied    BOOLEAN NOT NULL,
  patient_free_text   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  arrived_at          TIMESTAMPTZ,
  no_show_at          TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  CONSTRAINT bookings_keph_min_applied_chk CHECK (keph_min_applied BETWEEN 2 AND 6),
  CONSTRAINT bookings_red_flag_keph_chk CHECK (
    NOT red_flag_applied OR keph_min_applied >= 4
  ),
  CONSTRAINT bookings_department_facility_fk
    FOREIGN KEY (department_id, facility_id)
    REFERENCES departments (id, facility_id)
    ON DELETE RESTRICT,
  CONSTRAINT bookings_status_timestamps_chk CHECK (
    (
      status = 'booked'
      AND arrived_at IS NULL
      AND no_show_at IS NULL
      AND cancelled_at IS NULL
    )
    OR (
      status = 'arrived'
      AND arrived_at IS NOT NULL
      AND no_show_at IS NULL
      AND cancelled_at IS NULL
    )
    OR (
      status = 'no_show'
      AND no_show_at IS NOT NULL
      AND arrived_at IS NULL
      AND cancelled_at IS NULL
    )
    OR (
      status = 'cancelled'
      AND cancelled_at IS NOT NULL
      AND arrived_at IS NULL
      AND no_show_at IS NULL
    )
  )
);

COMMENT ON TABLE bookings IS
  'Supertype. MVP writes booking_kind=instant, booking_channel=ranked_recommend, department_id NULL. Red-flag rows are allowed (J2).';
COMMENT ON COLUMN bookings.booking_channel IS
  'Discovery path only. prepaid_partner is SHA-adjacent; no money, claims, or SHA tables.';
COMMENT ON COLUMN bookings.patient_free_text IS
  'Optional extra text (J1). Catalog mapping is the engine; do not treat this blob as triage input.';
COMMENT ON COLUMN bookings.keph_min_applied IS
  'MAX(symptoms.keph_min) (and red-flag lift) at book time. Not live catalog.';

CREATE INDEX bookings_hospital_queue_idx
  ON bookings (facility_id, status, created_at);

CREATE INDEX bookings_patient_idx
  ON bookings (patient_user_id, created_at DESC);

-- Instant open queue (derived position uses this)
CREATE INDEX bookings_instant_open_idx
  ON bookings (facility_id, created_at, id)
  WHERE booking_kind = 'instant' AND status = 'booked';

CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE booking_instant (
  booking_id BIGINT PRIMARY KEY REFERENCES bookings (id) ON DELETE RESTRICT
);

COMMENT ON TABLE booking_instant IS
  'Walk-in / book-now subtype (spec J1). Queue position is derived; wait_count lives on facilities.';

CREATE TABLE booking_appointments (
  booking_id   BIGINT PRIMARY KEY REFERENCES bookings (id) ON DELETE RESTRICT,
  slot_start   TIMESTAMPTZ NOT NULL,
  slot_end     TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  CONSTRAINT booking_appointments_slot_chk CHECK (slot_end > slot_start)
);

COMMENT ON TABLE booking_appointments IS
  'Whiteboard Photo B. MVP does not insert. confirmed_at NULL = pending confirmation.';

CREATE OR REPLACE FUNCTION trg_bookings_subtype_arc()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  has_instant BOOLEAN;
  has_appt    BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM booking_instant WHERE booking_id = NEW.id)
    INTO has_instant;
  SELECT EXISTS (SELECT 1 FROM booking_appointments WHERE booking_id = NEW.id)
    INTO has_appt;

  IF NEW.booking_kind = 'instant' THEN
    IF NOT has_instant OR has_appt THEN
      RAISE EXCEPTION
        'booking % kind=instant requires booking_instant only', NEW.id;
    END IF;
  ELSIF NEW.booking_kind = 'appointment' THEN
    IF NOT has_appt OR has_instant THEN
      RAISE EXCEPTION
        'booking % kind=appointment requires booking_appointments only', NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER bookings_subtype_arc
  AFTER INSERT OR UPDATE OF booking_kind ON bookings
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION trg_bookings_subtype_arc();

CREATE TABLE booking_symptoms (
  booking_id  BIGINT NOT NULL REFERENCES bookings (id) ON DELETE RESTRICT,
  symptom_id  BIGINT NOT NULL REFERENCES symptoms (id) ON DELETE RESTRICT,
  map_score   REAL,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (booking_id, symptom_id),
  CONSTRAINT booking_symptoms_map_score_chk CHECK (
    map_score IS NULL OR (map_score >= 0 AND map_score <= 1)
  )
);

CREATE OR REPLACE FUNCTION trg_booking_has_symptoms()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM booking_symptoms WHERE booking_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'booking % must have at least one booking_symptoms row', NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER bookings_require_symptoms
  AFTER INSERT ON bookings
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION trg_booking_has_symptoms();

-- Frozen KMHFR projection at book time (historical accuracy after registry updates)
CREATE TABLE booking_facility_snapshots (
  booking_id         BIGINT PRIMARY KEY REFERENCES bookings (id) ON DELETE RESTRICT,
  kmhfr_code         TEXT NOT NULL,
  name               TEXT NOT NULL,
  keph_level         SMALLINT NOT NULL,
  lat                DOUBLE PRECISION NOT NULL,
  lng                DOUBLE PRECISION NOT NULL,
  county             TEXT NOT NULL,
  wait_count_at_book INTEGER NOT NULL,
  snapshotted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT booking_facility_snapshots_keph_chk CHECK (keph_level BETWEEN 2 AND 6),
  CONSTRAINT booking_facility_snapshots_wait_chk CHECK (wait_count_at_book >= 0)
);

COMMENT ON TABLE booking_facility_snapshots IS
  'Frozen at INSERT of the booking. Why: J1 SMS/UI (name, KEPH, map, wait) must not change when KMHFR recodes the live facilities row. Live ranking still reads facilities.*';

-- Derived queue position (Photo B instant). Not wait_count.
CREATE VIEW v_instant_queue_positions AS
SELECT
  b.id AS booking_id,
  b.facility_id,
  b.created_at,
  ROW_NUMBER() OVER (
    PARTITION BY b.facility_id
    ORDER BY b.created_at, b.id
  ) AS queue_position
FROM bookings b
JOIN booking_instant bi ON bi.booking_id = b.id
WHERE b.booking_kind = 'instant'
  AND b.status = 'booked';

-- ---------------------------------------------------------------------------
-- Notes (staff of that facility only; patients never read)
-- ---------------------------------------------------------------------------

CREATE TABLE notes (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id       BIGINT NOT NULL REFERENCES bookings (id) ON DELETE RESTRICT,
  author_user_id   BIGINT NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  body_text        TEXT,
  audio_transcript TEXT,
  ocr_text         TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE notes IS
  'Clinical notes (J6). Never DELETE. Patients must not SELECT. Image bytes are object storage; this table holds text + OCR.';

CREATE INDEX notes_booking_idx ON notes (booking_id, created_at);

CREATE TRIGGER notes_set_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE note_images (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  note_id    BIGINT NOT NULL REFERENCES notes (id) ON DELETE RESTRICT,
  image_url  TEXT NOT NULL,
  ocr_text   TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN note_images.image_url IS
  'Object-storage URL only. Never store image bytes in Postgres.';

CREATE OR REPLACE FUNCTION trg_notes_author_staff_same_facility()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  booking_facility BIGINT;
  author_role user_role;
  author_facility BIGINT;
BEGIN
  SELECT b.facility_id INTO booking_facility
  FROM bookings b WHERE b.id = NEW.booking_id;

  SELECT u.role, u.facility_id
    INTO author_role, author_facility
  FROM users u WHERE u.id = NEW.author_user_id;

  IF author_role IS DISTINCT FROM 'hospital_staff'
     OR author_facility IS DISTINCT FROM booking_facility THEN
    RAISE EXCEPTION
      'note author % must be hospital_staff of booking facility %',
      NEW.author_user_id, booking_facility;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notes_author_staff_chk
  BEFORE INSERT OR UPDATE OF booking_id, author_user_id ON notes
  FOR EACH ROW
  EXECUTE FUNCTION trg_notes_author_staff_same_facility();

-- ---------------------------------------------------------------------------
-- Notify jobs
-- ---------------------------------------------------------------------------

CREATE TABLE notify_jobs (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id      BIGINT NOT NULL REFERENCES bookings (id) ON DELETE RESTRICT,
  channel         notify_channel NOT NULL,
  template        notify_template NOT NULL,
  locale          notify_locale NOT NULL,
  voice_provider  voice_provider,
  delivery_mode   notify_delivery_mode NOT NULL,
  status          notify_job_status NOT NULL DEFAULT 'pending',
  scheduled_for   TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempt_count   INTEGER NOT NULL DEFAULT 0,
  last_error      TEXT,
  vendor_payload  JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at         TIMESTAMPTZ,
  CONSTRAINT notify_jobs_voice_chk CHECK (
    (channel = 'sms' AND voice_provider IS NULL)
    OR (
      channel IN ('elevenlabs_call', 'twilio_play_pawa_audio')
      AND voice_provider IS NOT NULL
    )
  ),
  CONSTRAINT notify_jobs_pawa_play_chk CHECK (
    channel <> 'twilio_play_pawa_audio' OR voice_provider = 'pawa'
  )
);

COMMENT ON COLUMN notify_jobs.vendor_payload IS
  'Vendor request/response only (Africa''s Talking, ElevenLabs, Twilio, Pawa). Not a domain document. Do not put symptoms, ID numbers, or wait_count here.';
COMMENT ON COLUMN notify_jobs.delivery_mode IS
  'demo_log: write script + provider, do not autodial (J9 CI). live: send/dial.';

CREATE INDEX notify_jobs_due_idx
  ON notify_jobs (status, scheduled_for)
  WHERE status = 'pending';

CREATE INDEX notify_jobs_booking_idx ON notify_jobs (booking_id);

-- ---------------------------------------------------------------------------
-- Row-level security (staff facility isolation; patients cannot read notes)
-- Session GUCs set by FastAPI per transaction:
--   SET LOCAL app.user_id = '<bigint>';
--   SET LOCAL app.role = 'patient' | 'hospital_staff';
--   SET LOCAL app.facility_id = '<bigint>';  -- staff only
-- Table owner must FORCE RLS or use a non-owner app role. Migrations: BYPASSRLS.
-- Recommend (J7) stays open: no RLS on facilities SELECT.
-- ---------------------------------------------------------------------------

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings FORCE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes FORCE ROW LEVEL SECURITY;
ALTER TABLE note_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_images FORCE ROW LEVEL SECURITY;
ALTER TABLE notify_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notify_jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles FORCE ROW LEVEL SECURITY;

CREATE POLICY bookings_patient_own ON bookings
  FOR SELECT
  USING (
    current_setting('app.role', true) = 'patient'
    AND patient_user_id = NULLIF(current_setting('app.user_id', true), '')::bigint
  );

CREATE POLICY bookings_patient_insert ON bookings
  FOR INSERT
  WITH CHECK (
    current_setting('app.role', true) = 'patient'
    AND patient_user_id = NULLIF(current_setting('app.user_id', true), '')::bigint
  );

CREATE POLICY bookings_staff_facility_select ON bookings
  FOR SELECT
  USING (
    current_setting('app.role', true) = 'hospital_staff'
    AND facility_id = NULLIF(current_setting('app.facility_id', true), '')::bigint
  );

CREATE POLICY bookings_staff_facility_update ON bookings
  FOR UPDATE
  USING (
    current_setting('app.role', true) = 'hospital_staff'
    AND facility_id = NULLIF(current_setting('app.facility_id', true), '')::bigint
  )
  WITH CHECK (
    current_setting('app.role', true) = 'hospital_staff'
    AND facility_id = NULLIF(current_setting('app.facility_id', true), '')::bigint
  );
-- No DELETE policy on bookings.

CREATE POLICY notes_staff_same_facility_select ON notes
  FOR SELECT
  USING (
    current_setting('app.role', true) = 'hospital_staff'
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = notes.booking_id
        AND b.facility_id = NULLIF(current_setting('app.facility_id', true), '')::bigint
    )
  );

CREATE POLICY notes_staff_same_facility_insert ON notes
  FOR INSERT
  WITH CHECK (
    current_setting('app.role', true) = 'hospital_staff'
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = notes.booking_id
        AND b.facility_id = NULLIF(current_setting('app.facility_id', true), '')::bigint
    )
  );

CREATE POLICY notes_staff_same_facility_update ON notes
  FOR UPDATE
  USING (
    current_setting('app.role', true) = 'hospital_staff'
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = notes.booking_id
        AND b.facility_id = NULLIF(current_setting('app.facility_id', true), '')::bigint
    )
  );
-- Intentionally no notes policy for role=patient (J6). No DELETE policy.

CREATE POLICY note_images_via_note_select ON note_images
  FOR SELECT
  USING (
    current_setting('app.role', true) = 'hospital_staff'
    AND EXISTS (
      SELECT 1
      FROM notes n
      JOIN bookings b ON b.id = n.booking_id
      WHERE n.id = note_images.note_id
        AND b.facility_id = NULLIF(current_setting('app.facility_id', true), '')::bigint
    )
  );

CREATE POLICY note_images_via_note_insert ON note_images
  FOR INSERT
  WITH CHECK (
    current_setting('app.role', true) = 'hospital_staff'
    AND EXISTS (
      SELECT 1
      FROM notes n
      JOIN bookings b ON b.id = n.booking_id
      WHERE n.id = note_images.note_id
        AND b.facility_id = NULLIF(current_setting('app.facility_id', true), '')::bigint
    )
  );

CREATE POLICY notify_jobs_patient_own ON notify_jobs
  FOR SELECT
  USING (
    current_setting('app.role', true) = 'patient'
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = notify_jobs.booking_id
        AND b.patient_user_id = NULLIF(current_setting('app.user_id', true), '')::bigint
    )
  );

CREATE POLICY notify_jobs_patient_insert ON notify_jobs
  FOR INSERT
  WITH CHECK (
    current_setting('app.role', true) = 'patient'
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = notify_jobs.booking_id
        AND b.patient_user_id = NULLIF(current_setting('app.user_id', true), '')::bigint
    )
  );

CREATE POLICY notify_jobs_staff_facility_select ON notify_jobs
  FOR SELECT
  USING (
    current_setting('app.role', true) = 'hospital_staff'
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = notify_jobs.booking_id
        AND b.facility_id = NULLIF(current_setting('app.facility_id', true), '')::bigint
    )
  );

-- J9 worker / P5 sender: SET LOCAL app.role or use a BYPASSRLS connection.
CREATE POLICY notify_jobs_staff_facility_update ON notify_jobs
  FOR UPDATE
  USING (
    current_setting('app.role', true) = 'hospital_staff'
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = notify_jobs.booking_id
        AND b.facility_id = NULLIF(current_setting('app.facility_id', true), '')::bigint
    )
  );

CREATE POLICY patient_profiles_own ON patient_profiles
  FOR ALL
  USING (
    current_setting('app.role', true) = 'patient'
    AND user_id = NULLIF(current_setting('app.user_id', true), '')::bigint
  );
-- No staff policy on patient_profiles: HMAC/ciphertext must not leak via SELECT *.
-- J5 queue uses v_queue_patient_display (names + phone last-4 only).

CREATE VIEW v_queue_patient_display AS
SELECT
  u.id AS user_id,
  pp.given_name,
  pp.family_name,
  right(u.phone_e164, 4) AS phone_last4
FROM users u
LEFT JOIN patient_profiles pp ON pp.user_id = u.id
WHERE u.role = 'patient';

COMMENT ON VIEW v_queue_patient_display IS
  'J5 projection (name + phone last-4). Not a security boundary — always join bookings WHERE facility_id = staff facility. Never SELECT patient_profiles.*. P1: GRANT SELECT on this view; do not GRANT SELECT(id_number_hmac, id_number_ciphertext).';
