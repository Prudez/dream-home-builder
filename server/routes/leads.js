import { Router } from 'express';
import { contract, errorShape, ERROR_CODES } from '../../shared/contract.js';
import { query } from '../db.js';
import { loadCatalog } from '../lib/catalog.js';
import { computeLeadSignals } from '../lib/signals.js';

const router = Router();

// A bug in signal computation must never fail lead capture itself — the
// lead row is what actually matters to the business. Logged and swallowed;
// server/scripts/backfillSignals.js can fill in any row that fails here.
async function computeAndStoreSignals(lead, designRow) {
  try {
    const eventsResult = await query(
      `SELECT event_type AS "eventType", payload
       FROM dreamhome.events WHERE session_id = $1 ORDER BY created_at ASC`,
      [lead.sessionId]
    );
    const catalog = await loadCatalog();
    const design = { snapshot: designRow.snapshot };
    const { leadScore, scoreBreakdown, signals, raw } = computeLeadSignals({
      design,
      events: eventsResult.rows,
      catalog,
    });

    await query(
      `INSERT INTO dreamhome.lead_signals (lead_id, session_id, design_id, lead_score, score_breakdown, signals, raw)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (lead_id) DO UPDATE SET
         lead_score = EXCLUDED.lead_score,
         score_breakdown = EXCLUDED.score_breakdown,
         signals = EXCLUDED.signals,
         raw = EXCLUDED.raw`,
      [lead.id, lead.sessionId, lead.designId, leadScore, JSON.stringify(scoreBreakdown), JSON.stringify(signals), JSON.stringify(raw)]
    );
  } catch (err) {
    console.error(`Failed to compute lead_signals for lead ${lead.id}:`, err);
  }
}

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
      'SELECT id, snapshot FROM dreamhome.designs WHERE id = $1 AND session_id = $2',
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

    const lead = result.rows[0];
    res.status(201).json({ lead });

    await computeAndStoreSignals(lead, designCheck.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
