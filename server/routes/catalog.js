import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const [rooms, stylePacks, shells] = await Promise.all([
      query(
        `SELECT key, name, icon, per_cell_price AS "perCellPrice",
                default_w AS "defaultW", default_h AS "defaultH",
                min_w AS "minW", min_h AS "minH", max_w AS "maxW", max_h AS "maxH",
                group_name AS "groupName", ground_only AS "groundOnly", indoor
         FROM dreamhome.catalog_rooms ORDER BY sort_order`
      ),
      query(
        `SELECT key, name, tagline, canvas_color AS "canvasColor", swatch
         FROM dreamhome.catalog_style_packs ORDER BY sort_order`
      ),
      query(
        `SELECT key, name, description, floors, shell_cost AS "shellCost", icon
         FROM dreamhome.catalog_shells ORDER BY sort_order`
      ),
    ]);

    res.json({ rooms: rooms.rows, stylePacks: stylePacks.rows, shells: shells.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
