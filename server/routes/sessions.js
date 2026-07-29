import { Router } from 'express';
import { contract, errorShape, ERROR_CODES } from '../../shared/contract.js';
import { query } from '../db.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const errors = contract.createSession.validateRequest(req.body);
    if (errors.length > 0) {
      return res
        .status(400)
        .json(errorShape(ERROR_CODES.VALIDATION_ERROR, 'Invalid session payload', errors));
    }

    const { consent, stylePack = null, floors = null, device = null } = req.body;

    const result = await query(
      `INSERT INTO dreamhome.sessions (consent, style_pack, floors, device)
       VALUES ($1, $2, $3, $4)
       RETURNING id, consent, style_pack AS "stylePack", floors, device, created_at AS "createdAt"`,
      [consent, stylePack, floors, device]
    );

    res.status(201).json({ session: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const errors = contract.updateSessionShell.validateRequest(req.body);
    if (errors.length > 0) {
      return res
        .status(400)
        .json(errorShape(ERROR_CODES.VALIDATION_ERROR, 'Invalid session update payload', errors));
    }

    const { stylePack, floors } = req.body;

    const result = await query(
      `UPDATE dreamhome.sessions
       SET style_pack = $1, floors = $2
       WHERE id = $3
       RETURNING id, consent, style_pack AS "stylePack", floors, device, created_at AS "createdAt"`,
      [stylePack, floors, req.params.id]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json(errorShape(ERROR_CODES.NOT_FOUND, `Session ${req.params.id} does not exist`));
    }

    res.json({ session: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
