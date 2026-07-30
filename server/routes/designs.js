import { Router } from 'express';
import { contract, errorShape, ERROR_CODES } from '../../shared/contract.js';
import { indexBy, groupBy, totalCost } from '../../shared/cost.js';
import { query } from '../db.js';
import { loadCatalog } from '../lib/catalog.js';
import { computeProfileLabel, matchListings } from '../lib/profile.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const errors = contract.createDesign.validateRequest(req.body);
    if (errors.length > 0) {
      return res
        .status(400)
        .json(errorShape(ERROR_CODES.VALIDATION_ERROR, 'Invalid design payload', errors));
    }

    const { sessionId, shellKey, stylePack, floors, rooms } = req.body;

    const sessionCheck = await query('SELECT id FROM dreamhome.sessions WHERE id = $1', [sessionId]);
    if (sessionCheck.rowCount === 0) {
      return res
        .status(400)
        .json(
          errorShape(ERROR_CODES.VALIDATION_ERROR, 'Invalid design payload', [
            `sessionId ${sessionId} does not exist`,
          ])
        );
    }

    const catalog = await loadCatalog();
    const roomsByKey = indexBy(catalog.rooms, 'key');
    const shellsByKey = indexBy(catalog.shells, 'key');
    const furnitureById = indexBy(catalog.furniture, 'id');
    const furnitureByRoomType = groupBy(catalog.furniture, 'roomType');
    const finishesByGroup = groupBy(catalog.finishes, 'groupName');
    const finishesByGroupKey = Object.fromEntries(
      Object.entries(finishesByGroup).map(([group, entries]) => [group, indexBy(entries, 'key')])
    );

    // Recomputed server-side — a client-sent total is never trusted.
    const total = totalCost(rooms, roomsByKey, finishesByGroupKey, furnitureById, shellsByKey, shellKey);
    const profileLabel = computeProfileLabel({ rooms, floors, stylePack, furnitureByRoomType });

    const listingsResult = await query(
      `SELECT id, name, location, tagline, style_packs AS "stylePacks",
              min_bedrooms AS "minBedrooms", max_bedrooms AS "maxBedrooms",
              price_min AS "priceMin", price_max AS "priceMax"
       FROM dreamhome.catalog_listings ORDER BY sort_order`
    );
    const bedrooms = rooms.filter((r) => r.type === 'bedroom' || r.type === 'master').length;
    const matches = matchListings(listingsResult.rows, { stylePack, total, bedrooms });

    const snapshot = { shellKey, stylePack, floors, rooms };

    const result = await query(
      `INSERT INTO dreamhome.designs (session_id, profile_label, total, snapshot, matched_listing_ids)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, session_id AS "sessionId", profile_label AS "profileLabel", total,
                 snapshot, matched_listing_ids AS "matchedListingIds", created_at AS "createdAt"`,
      [sessionId, profileLabel, total, JSON.stringify(snapshot), JSON.stringify(matches.map((m) => m.id))]
    );

    res.status(201).json({ design: result.rows[0], matches });
  } catch (err) {
    next(err);
  }
});

export default router;
