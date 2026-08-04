-- 006_balcony.sql
-- Balcony room type: small footprint, restricted to floors above ground
-- (mirrors ground_only with the inverse upper_only flag). New 'balcony'
-- finish group and furniture set, following the veranda pattern (both are
-- outdoor, non-indoor rooms with no walls/windows drawn).

ALTER TABLE dreamhome.catalog_rooms
  ADD COLUMN IF NOT EXISTS upper_only boolean NOT NULL DEFAULT false;

INSERT INTO dreamhome.catalog_rooms
  (key, name, icon, per_cell_price, default_w, default_h, min_w, min_h, max_w, max_h, group_name, ground_only, indoor, sort_order, upper_only)
VALUES
  ('balcony', 'Balcony', '🍃', 160000, 3, 1, 2, 1, 4, 2, 'balcony', false, false, 14, true);

INSERT INTO dreamhome.catalog_finishes (group_name, key, name, mult, texture, colors, sort_order)
VALUES
  ('balcony', 'tiled', 'Tiled Deck', 1.0, 'tile',
   '[{"name":"Cream","hex":"#E8E2D4"},{"name":"Ash Grey","hex":"#CDD3D8"},{"name":"Terracotta","hex":"#C98F6E"}]'::jsonb, 1),
  ('balcony', 'glass', 'Glass Balustrade', 1.25, 'gloss',
   '[{"name":"Clear","hex":"#DDE6EA"},{"name":"Smoked","hex":"#8B97A8"}]'::jsonb, 2),
  ('balcony', 'timber', 'Timber Decking', 1.15, 'plank',
   '[{"name":"Light Oak","hex":"#C89F6B"},{"name":"Mahogany","hex":"#8E5B33"},{"name":"Dark Walnut","hex":"#6B4226"}]'::jsonb, 3);

INSERT INTO dreamhome.catalog_furniture (room_type, name, cost, description, sort_order)
VALUES
  ('balcony', 'Railing', 0, 'Balustrade included', 1),
  ('balcony', 'Balcony Lounge', 140000, 'Small table, chairs, planters', 2);
