import { query } from '../db.js';

// Shared by GET /api/catalog and POST /api/designs — the design-save route
// needs the exact same lookup data to recompute totals/profile server-side.
export async function loadCatalog() {
  const [rooms, stylePacks, shells, finishes, furniture, furnitureAddons] = await Promise.all([
    query(
      `SELECT key, name, icon, per_cell_price AS "perCellPrice",
              default_w AS "defaultW", default_h AS "defaultH",
              group_name AS "groupName", ground_only AS "groundOnly", indoor,
              upper_only AS "upperOnly"
       FROM dreamhome.catalog_rooms ORDER BY sort_order`
    ),
    query(
      `SELECT key, name, tagline, canvas_color AS "canvasColor", swatch,
              default_floor_finish_key AS "defaultFloorFinishKey",
              default_floor_color_index AS "defaultFloorColorIndex",
              premium_threshold AS "premiumThreshold"
       FROM dreamhome.catalog_style_packs ORDER BY sort_order`
    ),
    query(
      `SELECT key, name, description, floors, shell_cost AS "shellCost", icon
       FROM dreamhome.catalog_shells ORDER BY sort_order`
    ),
    query(
      `SELECT id, group_name AS "groupName", key, name, mult, texture, colors
       FROM dreamhome.catalog_finishes ORDER BY group_name, sort_order`
    ),
    query(
      `SELECT id, room_type AS "roomType", name, cost, description
       FROM dreamhome.catalog_furniture ORDER BY room_type, sort_order`
    ),
    query(
      `SELECT id, room_type AS "roomType", addon_key AS "addonKey", name, price
       FROM dreamhome.catalog_furniture_addons ORDER BY room_type, sort_order`
    ),
  ]);

  return {
    rooms: rooms.rows,
    stylePacks: stylePacks.rows,
    shells: shells.rows,
    finishes: finishes.rows,
    furniture: furniture.rows,
    furnitureAddons: furnitureAddons.rows,
  };
}
