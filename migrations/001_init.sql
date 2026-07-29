-- 001_init.sql
-- Walking skeleton: sessions and events tables in the dreamhome schema.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS dreamhome.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consent boolean NOT NULL,
  style_pack text,
  floors integer,
  device text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dreamhome.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES dreamhome.sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb,
  elapsed_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_session_id ON dreamhome.events (session_id);
