-- CareFlow first-boot init (docker-entrypoint-initdb.d).
-- Runs only on an empty volume. POSTGRES_USER=careflow_owner already owns
-- database careflow as the container superuser (BYPASSRLS for Alembic).
--
-- This file creates the app role used by FastAPI for care-seeker and
-- hospital-staff traffic. Do not create product tables here (Alembic owns
-- DDL: facilities, wait_count as a desk field, pretriage catalog, bookings).
--
-- Role careflow must NOT have BYPASSRLS. Staff isolation is RLS FORCE on
-- bookings / notes / note_images keyed by hospital-staff facility_id.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'careflow') THEN
    CREATE ROLE careflow WITH
      LOGIN
      PASSWORD 'careflow'
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      NOBYPASSRLS;
  END IF;
END
$$;

GRANT CONNECT ON DATABASE careflow TO careflow;
GRANT USAGE ON SCHEMA public TO careflow;

ALTER DEFAULT PRIVILEGES FOR ROLE careflow_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO careflow;

ALTER DEFAULT PRIVILEGES FOR ROLE careflow_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO careflow;
