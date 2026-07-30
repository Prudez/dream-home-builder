-- 003_finishes_furniture.sql
-- Finishes, colourways, and furniture sets, plus per-style-pack defaults
-- and premium threshold. Seeded from dream-home-builder-v4.jsx
-- (FINISHES, FURNITURE, PACKS.defFloor, PREMIUM_THRESHOLD).

CREATE TABLE IF NOT EXISTS dreamhome.catalog_finishes (
  id serial PRIMARY KEY,
  group_name text NOT NULL,
  key text NOT NULL,
  name text NOT NULL,
  mult numeric NOT NULL,
  texture text NOT NULL,
  colors jsonb NOT NULL,
  sort_order integer NOT NULL,
  UNIQUE (group_name, key)
);

CREATE TABLE IF NOT EXISTS dreamhome.catalog_furniture (
  id serial PRIMARY KEY,
  room_type text NOT NULL,
  name text NOT NULL,
  cost numeric NOT NULL,
  description text NOT NULL,
  sort_order integer NOT NULL
);

ALTER TABLE dreamhome.catalog_style_packs
  ADD COLUMN IF NOT EXISTS default_floor_finish_key text,
  ADD COLUMN IF NOT EXISTS default_floor_color_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS premium_threshold numeric NOT NULL DEFAULT 18000000;

INSERT INTO dreamhome.catalog_finishes (group_name, key, name, mult, texture, colors, sort_order)
VALUES
  ('floor', 'ceramic', 'Ceramic Tile', 1.0, 'tile',
   '[{"name":"Cream","hex":"#E8E2D4"},{"name":"Ash Grey","hex":"#CDD3D8"},{"name":"Terracotta","hex":"#C98F6E"}]'::jsonb, 1),
  ('floor', 'laminate', 'Wood Laminate', 1.15, 'plank',
   '[{"name":"Light Oak","hex":"#C89F6B"},{"name":"Mahogany","hex":"#8E5B33"},{"name":"Dark Walnut","hex":"#6B4226"}]'::jsonb, 2),
  ('floor', 'parquet', 'Hardwood Parquet', 1.3, 'parquet',
   '[{"name":"Honey","hex":"#B98A55"},{"name":"Teak","hex":"#8E5B33"},{"name":"Ebony","hex":"#513222"}]'::jsonb, 3),
  ('floor', 'porcelain', 'Polished Porcelain', 1.35, 'gloss',
   '[{"name":"Arctic White","hex":"#F2F0EC"},{"name":"Silver","hex":"#B9BEC6"},{"name":"Charcoal","hex":"#5C6167"}]'::jsonb, 4),
  ('floor', 'carpet', 'Carpet', 1.1, 'carpet',
   '[{"name":"Sand","hex":"#C4B8A5"},{"name":"Slate Blue","hex":"#8FA0B5"},{"name":"Plum","hex":"#9E8FA8"}]'::jsonb, 5),

  ('kitchen', 'standard', 'Standard Fitted', 1.0, 'tile',
   '[{"name":"Cream","hex":"#E8E2D4"},{"name":"Cool Grey","hex":"#D8DDE2"}]'::jsonb, 1),
  ('kitchen', 'granite', 'Granite Counters', 1.2, 'granite',
   '[{"name":"Grey Granite","hex":"#6E747B"},{"name":"Black Galaxy","hex":"#3E3A36"},{"name":"Sahara","hex":"#8A7C66"}]'::jsonb, 2),
  ('kitchen', 'island', 'Modern + Island', 1.45, 'gloss',
   '[{"name":"Gloss White","hex":"#F2F0EC"},{"name":"Navy Matte","hex":"#2E3A46"},{"name":"Sage","hex":"#8B9A8B"}]'::jsonb, 3),
  ('kitchen', 'chef', 'Chef''s Luxury', 1.65, 'granite',
   '[{"name":"Onyx","hex":"#2A2E33"},{"name":"Walnut & Stone","hex":"#5A4A3A"}]'::jsonb, 4),

  ('bath', 'standard', 'Standard Tile', 1.0, 'tile',
   '[{"name":"Sky","hex":"#DDE6EA"},{"name":"Cream","hex":"#E8E2D4"}]'::jsonb, 1),
  ('bath', 'fulltile', 'Full-Tile + Heated Shower', 1.25, 'tile',
   '[{"name":"Ocean","hex":"#AFC6CE"},{"name":"Mint","hex":"#C9D6D2"},{"name":"Desert","hex":"#D9C9B8"}]'::jsonb, 2),
  ('bath', 'stone', 'Stone Luxury', 1.55, 'granite',
   '[{"name":"Mazeras","hex":"#8C8478"},{"name":"Slate","hex":"#5C6167"}]'::jsonb, 3),

  ('garden', 'lawn', 'Open Lawn', 1.0, 'grass',
   '[{"name":"Kikuyu Green","hex":"#5E8C4A"},{"name":"Deep Green","hex":"#4A7245"},{"name":"Bright","hex":"#74A052"}]'::jsonb, 1),
  ('garden', 'trees', 'Lawn + Trees', 1.35, 'grass',
   '[{"name":"Kikuyu Green","hex":"#5E8C4A"},{"name":"Deep Green","hex":"#4A7245"}]'::jsonb, 2),
  ('garden', 'landscaped', 'Landscaped + Paths', 1.9, 'grass',
   '[{"name":"Kikuyu Green","hex":"#5E8C4A"},{"name":"Bright","hex":"#74A052"}]'::jsonb, 3),

  ('pool', 'classic', 'Classic Pool', 1.0, 'water',
   '[{"name":"Aqua","hex":"#3FA9C9"},{"name":"Deep Blue","hex":"#2E7FB8"},{"name":"Lagoon","hex":"#35B8AE"}]'::jsonb, 1),
  ('pool', 'deck', 'Tiled Deck Pool', 1.3, 'water',
   '[{"name":"Aqua","hex":"#3FA9C9"},{"name":"Deep Blue","hex":"#2E7FB8"}]'::jsonb, 2),
  ('pool', 'infinity', 'Infinity Edge', 1.7, 'water',
   '[{"name":"Deep Blue","hex":"#2E7FB8"},{"name":"Lagoon","hex":"#35B8AE"}]'::jsonb, 3);

INSERT INTO dreamhome.catalog_furniture (room_type, name, cost, description, sort_order)
VALUES
  ('living', 'Essentials', 0, 'Sofa & coffee table', 1),
  ('living', 'Family Lounge', 450000, 'Rug, TV wall, armchairs', 2),
  ('living', 'Entertainer''s Suite', 900000, 'L-sofa, dining set, bar', 3),

  ('bedroom', 'Essentials', 0, 'Bed', 1),
  ('bedroom', 'Comfort Set', 250000, 'Wardrobe & side tables', 2),

  ('master', 'Essentials', 0, 'Bed & wardrobe', 1),
  ('master', 'Master Suite', 400000, 'King bed, vanity, chair', 2),
  ('master', 'Luxury Suite', 750000, 'Walk-in rail & bench', 3),

  ('office', 'Desk Setup', 0, 'Desk & chair', 1),
  ('office', 'Executive Study', 350000, 'Bookshelves & guest seat', 2),

  ('kitchen', 'Standard', 0, 'Fitted counters', 1),
  ('kitchen', 'Breakfast Nook', 200000, 'Table & stools', 2),

  ('bath', 'Shower', 0, 'Shower & WC', 1),
  ('bath', 'Bathtub', 300000, 'Tub upgrade', 2),

  ('veranda', 'Open', 0, 'Clear veranda', 1),
  ('veranda', 'Seating', 120000, 'Chairs & plants', 2),

  ('garden', 'Open Garden', 0, 'Just the greenery', 1),
  ('garden', 'Alfresco Set', 180000, 'Outdoor dining', 2),
  ('garden', 'Boma Fire Pit', 350000, 'Fire pit & benches', 3),

  ('pool', 'Just the Pool', 0, 'Clean deck', 1),
  ('pool', 'Loungers', 150000, 'Sun loungers & umbrella', 2),

  ('dsq', 'Unfurnished', 0, 'Empty unit', 1),
  ('dsq', 'Furnished', 280000, 'Bed & kitchenette', 2);

UPDATE dreamhome.catalog_style_packs SET default_floor_finish_key = 'porcelain', default_floor_color_index = 0 WHERE key = 'minimalist';
UPDATE dreamhome.catalog_style_packs SET default_floor_finish_key = 'laminate', default_floor_color_index = 1 WHERE key = 'coastal';
UPDATE dreamhome.catalog_style_packs SET default_floor_finish_key = 'parquet', default_floor_color_index = 1 WHERE key = 'stone';
UPDATE dreamhome.catalog_style_packs SET default_floor_finish_key = 'ceramic', default_floor_color_index = 0 WHERE key = 'compact';
