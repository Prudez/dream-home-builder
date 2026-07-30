import { Router } from 'express';
import { contract, errorShape, ERROR_CODES } from '../../shared/contract.js';
import { query } from '../db.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const errors = contract.createLead.validateRequest(req.body);
    if (errors.length > 0) {
      return res
        .status(400)
        .json(errorShape(ERROR_CODES.VALIDATION_ERROR, 'Invalid lead payload', errors));
    }

    const { sessionId, designId, whatsapp } = req.body;

    const designCheck = await query(
      'SELECT id FROM dreamhome.designs WHERE id = $1 AND session_id = $2',
      [designId, sessionId]
    );
    if (designCheck.rowCount === 0) {
      return res
        .status(404)
        .json(errorShape(ERROR_CODES.NOT_FOUND, `Design ${designId} does not exist for this session`));
    }

    const result = await query(
      `INSERT INTO dreamhome.leads (session_id, design_id, whatsapp)
       VALUES ($1, $2, $3)
       RETURNING id, session_id AS "sessionId", design_id AS "designId", whatsapp, created_at AS "createdAt"`,
      [sessionId, designId, whatsapp]
    );

    res.status(201).json({ lead: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
