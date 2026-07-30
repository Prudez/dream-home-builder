-- 005_lead_signals.sql
-- Derived buyer-intent signals and a documented lead score per lead.
-- One row per lead (UNIQUE(lead_id)) so the backfill job can safely
-- INSERT ... ON CONFLICT (lead_id) DO UPDATE and stay idempotent.

CREATE TABLE IF NOT EXISTS dreamhome.lead_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL UNIQUE REFERENCES dreamhome.leads(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES dreamhome.sessions(id) ON DELETE CASCADE,
  design_id uuid REFERENCES dreamhome.designs(id) ON DELETE SET NULL,
  lead_score integer NOT NULL,
  score_breakdown jsonb NOT NULL,
  signals jsonb NOT NULL,
  raw jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_signals_session_id ON dreamhome.lead_signals(session_id);
