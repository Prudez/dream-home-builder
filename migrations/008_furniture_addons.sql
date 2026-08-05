-- 008_furniture_addons.sql
-- Toggleable furniture add-ons layered on top of the existing base
-- furniture tier (Essentials / Family Lounge / etc). Independent of tier
-- selection — a player can have "Essentials" furniture and still switch on
-- a rug, or "Entertainer's Suite" furniture with every add-on off. One row
-- per (room_type, addon_key); addon_key is what a placed room's `addons`
-- array stores (see shared/contract.js's validateDesignRoomEntry).

CREATE TABLE IF NOT EXISTS dreamhome.catalog_furniture_addons (
  id serial PRIMARY KEY,
  room_type text NOT NULL,
  addon_key text NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL,
  sort_order integer NOT NULL,
  UNIQUE (room_type, addon_key)
);

INSERT INTO dreamhome.catalog_furniture_addons (room_type, addon_key, name, price, sort_order)
VALUES
  ('living', 'rug', 'Accent Rug', 35000, 1),
  ('living', 'tv_console', 'TV Console', 85000, 2),
  ('living', 'wall_art', 'Wall Art', 40000, 3),
  ('living', 'plant', 'Statement Plant', 18000, 4),

  ('bedroom', 'headboard', 'Upholstered Headboard', 45000, 1),
  ('bedroom', 'bedside_lamp', 'Bedside Lamp', 12000, 2),
  ('bedroom', 'rug', 'Bedroom Rug', 28000, 3),
  ('bedroom', 'bench', 'Foot-of-Bed Bench', 38000, 4),

  ('master', 'headboard', 'Upholstered Headboard', 60000, 1),
  ('master', 'bedside_lamp', 'Pair of Bedside Lamps', 22000, 2),
  ('master', 'rug', 'Master Rug', 42000, 3),
  ('master', 'bench', 'Foot-of-Bed Bench', 55000, 4),

  ('kitchen', 'bar_stools', 'Bar Stools', 55000, 1),
  ('kitchen', 'pendant_light', 'Pendant Light', 32000, 2),

  ('bath', 'bath_mat', 'Bath Mat', 6000, 1),
  ('bath', 'wall_shelf', 'Wall Shelf', 16000, 2),

  ('office', 'desk_lamp', 'Desk Lamp', 9000, 1),
  ('office', 'wall_art', 'Wall Art', 30000, 2),

  ('veranda', 'planters', 'Planters', 20000, 1),
  ('veranda', 'string_lights', 'String Lights', 28000, 2),

  ('garden', 'string_lights', 'String Lights', 30000, 1),
  ('garden', 'planters', 'Planters', 25000, 2),

  ('pool', 'umbrella', 'Pool Umbrella', 45000, 1),

  ('dsq', 'wall_shelf', 'Wall Shelf', 14000, 1),
  ('dsq', 'curtains', 'Curtains', 12000, 2),

  ('balcony', 'planters', 'Planter Boxes', 18000, 1),
  ('balcony', 'string_lights', 'String Lights', 22000, 2);
