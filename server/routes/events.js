import { Router } from 'express';
import { contract, errorShape, ERROR_CODES } from '../../shared/contract.js';
import { query } from '../db.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const errors = contract.logEvent.validateRequest(req.body);
    if (errors.length > 0) {
      return res
        .status(400)
        .json(errorShape(ERROR_CODES.VALIDATION_ERROR, 'Invalid event payload', errors));
    }

    const { sessionId, events } = req.body;

    const sessionCheck = await query('SELECT id FROM dreamhome.sessions WHERE id = $1', [sessionId]);
    if (sessionCheck.rowCount === 0) {
      return res
        .status(400)
        .json(
          errorShape(ERROR_CODES.VALIDATION_ERROR, 'Invalid event payload', [
            `sessionId ${sessionId} does not exist`,
          ])
        );
    }

    const values = [];
    const rows = events.map((entry, i) => {
      const base = i * 4;
      values.push(sessionId, entry.eventType, entry.payload ?? null, entry.elapsedMs ?? null);
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
    });

    const result = await query(
      `INSERT INTO dreamhome.events (session_id, event_type, payload, elapsed_ms)
       VALUES ${rows.join(', ')}
       RETURNING id, session_id AS "sessionId", event_type AS "eventType", payload, elapsed_ms AS "elapsedMs", created_at AS "createdAt"`,
      values
    );

    res.status(201).json({ events: result.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
