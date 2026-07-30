// Computes (or recomputes) dreamhome.lead_signals for every lead. Run this
// after a signals-formula change, or to fill in rows that failed to compute
// synchronously when their lead was created (see routes/leads.js, which
// swallows signal-computation errors so they never fail lead capture).
//
// Idempotent: every write is an upsert keyed on the lead_signals.lead_id
// UNIQUE constraint, so running this twice in a row produces the same rows.

import 'dotenv/config';
import { pool, query } from '../db.js';
import { loadCatalog } from '../lib/catalog.js';
import { computeLeadSignals } from '../lib/signals.js';

async function run() {
  const leadsResult = await query(
    `SELECT id, session_id AS "sessionId", design_id AS "designId" FROM dreamhome.leads ORDER BY created_at ASC`
  );
  const catalog = await loadCatalog();

  let computed = 0;
  let skipped = 0;

  for (const lead of leadsResult.rows) {
    if (!lead.designId) {
      console.log(`skip lead ${lead.id} (no linked design)`);
      skipped += 1;
      continue;
    }

    const designResult = await query('SELECT snapshot FROM dreamhome.designs WHERE id = $1', [lead.designId]);
    if (designResult.rowCount === 0) {
      console.log(`skip lead ${lead.id} (design ${lead.designId} not found)`);
      skipped += 1;
      continue;
    }

    const eventsResult = await query(
      `SELECT event_type AS "eventType", payload
       FROM dreamhome.events WHERE session_id = $1 ORDER BY created_at ASC`,
      [lead.sessionId]
    );

    const { leadScore, scoreBreakdown, signals, raw } = computeLeadSignals({
      design: { snapshot: designResult.rows[0].snapshot },
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
    console.log(`computed lead ${lead.id} → score ${leadScore}`);
    computed += 1;
  }

  console.log(`done: ${computed} computed, ${skipped} skipped`);
}

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
