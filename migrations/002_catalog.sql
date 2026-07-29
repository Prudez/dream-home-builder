-- 002_catalog.sql
-- Game core: room, style pack, and shell catalogues. Config in the
-- database so prices can be tuned without a client redeploy. Seeded from
-- dream-home-builder-v4.jsx (ROOM_TYPES, PACKS, FLOOR_OPTIONS).

CREATE TABLE IF NOT EXISTS dreamhome.catalog_rooms (
  key text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL,
  per_cell_price numeric NOT NULL,
  default_w integer NOT NULL,
  default_h integer NOT NULL,
  min_w integer NOT NULL,
  min_h integer NOT NULL,
  max_w integer NOT NULL,
  max_h integer NOT NULL,
  group_name text,
  ground_only boolean NOT NULL DEFAULT false,
  indoor boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL
);

CREATE TABLE IF NOT EXISTS dreamhome.catalog_style_packs (
  key text PRIMARY KEY,
  name text NOT NULL,
  tagline text NOT NULL,
  canvas_color text NOT NULL,
  swatch jsonb NOT NULL,
  sort_order integer NOT NULL
);

CREATE TABLE IF NOT EXISTS dreamhome.catalog_shells (
  key text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  floors integer NOT NULL,
  shell_cost numeric NOT NULL,
  icon text NOT NULL,
  sort_order integer NOT NULL
);

INSERT INTO dreamhome.catalog_rooms
  (key, name, icon, per_cell_price, default_w, default_h, min_w, min_h, max_w, max_h, group_name, ground_only, indoor, sort_order)
VALUES
  ('living',   'Living Room',       '🛋',  260000,  3, 3, 2, 2, 6, 5, 'floor',  false, true,  1),
  ('kitchen',  'Kitchen',           '🍳',  480000,  2, 2, 1, 2, 4, 3, 'kitchen',false, true,  2),
  ('master',   'Master En-suite',   '🛏',  340000,  3, 2, 2, 2, 4, 4, 'floor',  false, true,  3),
  ('bedroom',  'Bedroom',           '🛌',  330000,  2, 2, 1, 2, 4, 3, 'floor',  false, true,  4),
  ('bath',     'Bathroom',          '🛁',  500000,  1, 2, 1, 1, 2, 2, 'bath',   false, true,  5),
  ('office',   'Home Office',       '💻',  300000,  2, 2, 1, 1, 3, 3, 'floor',  false, true,  6),
  ('veranda',  'Veranda',           '☀️',  150000,  3, 1, 2, 1, 6, 2, NULL,     false, false, 7),
  ('dsq',      'DSQ',               '🏠',  350000,  2, 2, 2, 2, 3, 3, 'floor',  true,  true,  8),
  ('garage',   'Garage',            '🚗',  180000,  3, 2, 2, 2, 4, 3, NULL,     true,  false, 9),
  ('pool',     'Swimming Pool',     '🏊',  270000,  3, 4, 2, 3, 5, 6, 'pool',   true,  false, 10),
  ('garden',   'Garden / Lawn',     '🌿',  45000,   3, 3, 2, 2, 7, 6, 'garden', true,  false, 11),
  ('gate',     'Electric Gate',     '🚧',  650000,  2, 1, 2, 1, 2, 1, NULL,     true,  false, 12),
  ('borehole', 'Borehole',          '💧',  1500000, 1, 1, 1, 1, 1, 1, NULL,     true,  false, 13);

INSERT INTO dreamhome.catalog_style_packs
  (key, name, tagline, canvas_color, swatch, sort_order)
VALUES
  ('minimalist', 'Modern Minimalist', 'Flat roofs, glass, clean grey',
   '#FBFBFC', '["#F2F0EC","#B9BEC6","#1D4477","#4E7A57"]'::jsonb, 1),
  ('coastal', 'Swahili Coastal', 'Arches, carved wood, warm tones',
   '#FDF8F1', '["#A8743F","#C89B7B","#8A4B2D","#5B8A5E"]'::jsonb, 2),
  ('stone', 'Classic Stone', 'Pitched roofs, natural stone, the Karen look',
   '#F7F7F3', '["#8C8478","#5C6167","#41503F","#4E7A57"]'::jsonb, 3),
  ('compact', 'Smart Compact', 'Optimized starter home',
   '#FBFBFC', '["#E8E2D4","#CDD3D8","#33415C","#4E7A57"]'::jsonb, 4);

INSERT INTO dreamhome.catalog_shells
  (key, name, description, floors, shell_cost, icon, sort_order)
VALUES
  ('bungalow', 'Bungalow', 'Single level, full plot living', 1, 3500000, '🏠', 1),
  ('maisonette', 'Maisonette', '2 storeys, the family classic', 2, 5800000, '🏡', 2),
  ('townhouse', 'Townhouse', '3 storeys, maximum build', 3, 8400000, '🏢', 3);
