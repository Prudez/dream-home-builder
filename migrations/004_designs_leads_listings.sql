-- 004_designs_leads_listings.sql
-- Reveal and lead capture: design snapshots, WhatsApp leads, and a
-- matched-listings catalogue. catalog_listings seed rows are placeholder
-- inventory in the prototype's voice (dream-home-builder-v4.jsx lines
-- 1051-1053) pending real current listings from the Blue Falcon sales team.

CREATE TABLE IF NOT EXISTS dreamhome.catalog_listings (
  id serial PRIMARY KEY,
  name text NOT NULL,
  location text NOT NULL,
  tagline text NOT NULL,
  style_packs jsonb NOT NULL DEFAULT '[]',
  min_bedrooms integer NOT NULL DEFAULT 0,
  max_bedrooms integer,
  price_min numeric,
  price_max numeric,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS dreamhome.designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES dreamhome.sessions(id) ON DELETE CASCADE,
  profile_label text NOT NULL,
  total numeric NOT NULL,
  snapshot jsonb NOT NULL,
  matched_listing_ids jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_designs_session_id ON dreamhome.designs(session_id);

CREATE TABLE IF NOT EXISTS dreamhome.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES dreamhome.sessions(id) ON DELETE CASCADE,
  design_id uuid REFERENCES dreamhome.designs(id) ON DELETE SET NULL,
  whatsapp text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_session_id ON dreamhome.leads(session_id);

INSERT INTO dreamhome.catalog_listings
  (name, location, tagline, style_packs, min_bedrooms, max_bedrooms, price_min, price_max, sort_order)
VALUES
  ('Plainsview Estate', 'Kitengela', 'Phase 2 bungalows, entry-level compact builds',
   '["compact","minimalist"]'::jsonb, 2, 3, 3000000, 9000000, 1),
  ('Emayian Residences', 'Laiser Hill', 'Stone-clad maisonettes with garden plots',
   '["stone","coastal"]'::jsonb, 3, 5, 9000000, 18000000, 2),
  ('Namanga Highway Serviced Plots', 'Nairobi–Namanga Highway', 'Build-your-own serviced plots, any style',
   '["minimalist","coastal","stone","compact"]'::jsonb, 0, NULL, NULL, 12000000, 3),
  ('Karen Stone Villas', 'Karen', 'Pitched-roof stone villas with pool-ready plots',
   '["stone"]'::jsonb, 4, 6, 18000000, NULL, 4),
  ('Tamarind Coastal Court', 'Diani', 'Swahili-arch townhouses near the beach',
   '["coastal"]'::jsonb, 3, 4, 10000000, 20000000, 5),
  ('Beryl Smart Homes', 'Ruiru', 'Compact smart-starter bungalows',
   '["compact","minimalist"]'::jsonb, 1, 2, 2500000, 7000000, 6);
