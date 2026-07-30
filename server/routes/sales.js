import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/leads', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         l.id, l.whatsapp, l.created_at AS "createdAt",
         d.profile_label AS "profileLabel", d.total, d.snapshot,
         ls.lead_score AS "leadScore", ls.score_breakdown AS "scoreBreakdown", ls.signals
       FROM dreamhome.leads l
       LEFT JOIN dreamhome.designs d ON d.id = l.design_id
       LEFT JOIN dreamhome.lead_signals ls ON ls.lead_id = l.id
       ORDER BY l.created_at DESC`
    );

    const leads = result.rows.map((row) => ({
      id: row.id,
      whatsapp: row.whatsapp,
      createdAt: row.createdAt,
      profileLabel: row.profileLabel,
      total: row.total,
      stylePack: row.snapshot?.stylePack ?? null,
      leadScore: row.leadScore,
      scoreBreakdown: row.scoreBreakdown ?? [],
      signals: row.signals ?? [],
    }));

    res.json({ leads });
  } catch (err) {
    next(err);
  }
});

export default router;
