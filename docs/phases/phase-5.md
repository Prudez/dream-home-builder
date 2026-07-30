# Phase 5 Handoff

> Repo path: `docs/phases/phase-5.md`.
> Companion: `shared/contract.js` holds the current interface shape. This document references it; it does not duplicate it.

**Phase:** 5
**Date closed:** 2026-07-30
**One-line summary:** Every lead now gets a derived signals row — plain-language buyer-intent signals plus a documented 0–100 score — computed by replaying its session's full event log, surfaced on a minimal internal sales page.

---

## 1. What shipped

- Schema: migration `005_lead_signals.sql` — `dreamhome.lead_signals`, one row per lead (`UNIQUE(lead_id)`), storing `lead_score`, an itemized `score_breakdown`, a plain-language `signals` array, and the underlying `raw` numbers.
- Shared logic: `shared/catalogDefaults.js` — `defaultFinishFor`/`defaultFurnitureFor` extracted out of `PlotCanvas.jsx` so the client's placement defaults and the server's session replay resolve identically.
- Backend: `server/lib/replay.js` — reconstructs a session's room-by-room history from `dreamhome.events` (chronological order), recomputing `total` after every mutating event to track true peak cost, plus `removals`/`grows`/`shrinks`/`upgrades`/`financing` — all counters the prototype tracked live in React state but our event payloads only carry the *new* value for, never the old one.
- Backend: `server/lib/signals.js` — `computeLeadSignals()`, porting the prototype's `insights` logic (current-state signals off the lead's linked design snapshot) plus the replay counters (cumulative signals) into a `signals` array and a documented lead score.
- Backend: `POST /api/leads` now computes and upserts a `lead_signals` row synchronously after responding to the client (never blocking or failing lead capture on a signals bug — logged and swallowed). `server/scripts/backfillSignals.js` (idempotent, `npm run backfill-signals`) recomputes signals for every lead, filling in anything that failed inline or predates this phase.
- Backend: `GET /api/sales/leads` — leads joined with their signals, newest first.
- Client: `client/sales.html` / `src/sales-main.jsx` / `src/SalesPage.jsx` — a minimal internal page (Vite's second entry point, reached directly at `/sales.html`, not linked from the game) listing scored leads with a colour-coded score badge and the full plain-language signal list.

## 2. Contract diff

- New endpoint: `getSalesLeads` (`GET /api/sales/leads`, no request validation, same pattern as `getCatalog`).
- No `EVENT_TYPES` changes this phase — signals are derived from the existing taxonomy, not new events.
- `room_added` event payloads now include `roomId` (previously omitted — every other room-referencing event already logged it). Additive and backward-compatible; the replay engine falls back to sequential id inference for events logged before this change (see Open Issues).

## 3. Environment state

- Migration state: `001_init.sql` through `005_lead_signals.sql` all applied.
- New npm scripts: root and `server/package.json` both gained `backfill-signals`, mirroring the existing `migrate` script pair.
- No new dependencies, no new env vars.

## 4. Open issues / known-broken

- **Nothing broken.** All four acceptance criteria pass; see verification below.
- **Event ordering relies on distinct `created_at` timestamps.** `replaySession` processes events in `ORDER BY created_at ASC`. Events flushed together in a single batch (the normal case — `useEventQueue` batches interaction events and POSTs them together every few seconds) share the same `INSERT` statement and can share the same transaction timestamp, so ties are technically possible. In practice a single `INSERT` preserves its `VALUES` list order for tied timestamps, and this phase's verification (below) confirms replay produces exactly the right counters — but it's not a SQL-guaranteed ordering. A future hardening pass could add a monotonic `seq` column to `dreamhome.events` (`bigserial`, ordered alongside `created_at`) to make this airtight; not done here since it's a pre-existing Phase 2 event-logging characteristic that Phase 5 is the first to actually depend on, not something this phase introduced.
- **No authentication on `/api/sales/leads` or `/sales.html`.** Deliberately out of scope per the phase prompt — Phase 6 is where hardening happens. Flagging so it isn't launched as-is.

## 5. Decisions and why

- **Session replay instead of adding "old value" fields to every event payload.** The alternative — logging `previousW`/`previousH`, `previousFinishKey`, etc. on every mutating event — would have reopened Phase 2/3's already-shipped, already-verified event contract for every interaction type, for a need that's specific to Phase 5. Replaying the event log to reconstruct history instead is also just a more direct expression of the house's own data principle ("log events, not just final state") — the signals job *is* the thing that's supposed to reconstruct history from the log, not read it pre-computed.
- **Current-state signals read the design snapshot; cumulative signals read the full event replay.** These intentionally use different sources because they mean different things: "how many bedrooms does the finished design have" should reflect what the player actually finished with, while "did they ever remove a room" has to survive that room's removal. The verification walkthrough below is a real example of this divergence: final `bedrooms: 2` (post-removal) alongside `removals: 1` in the same row.
- **`POST /api/leads` responds before signal computation finishes, not after.** The insert-then-await-then-respond order in the plan would have made every lead capture wait on a full event replay + catalog load. Responding first and computing signals as trailing work in the same request handler keeps lead capture fast while still completing before the process would ever exit; a bug here is caught and logged, never surfaced to the player.
- **Lead score sums to a clean 100 with no penalty applied.** Budget(25) + financing(20) + household(10) + furnishing(10) + aspiration(10) + premium/pool(10) + lifestyle(15, capped) = 100 exactly, so a score can always be read as "out of 100" without a mental normalization step. The price-sensitivity penalty (−15) is the only thing that can push a score below what those components alone would suggest — a deliberate signal that removal/shrink-heavy sessions read as less sales-ready even with a high peak cost.
- **`/sales.html` as a second Vite entry, not a client-side route.** The main game (`index.html`) has no router and doesn't need one — adding one solely to host a single internal page would have been a bigger footprint than Vite's standard multi-page setup (`build.rollupOptions.input`), which needed one config change and two small new files.

## 6. PropIQ integration

PropIQ is a separate app reading the same Supabase project, per `docs/phases/README.md`. Since it's the same Postgres instance, it doesn't need an API from this app — it can query `dreamhome.lead_signals` directly with its own connection. The stable interface it should depend on:

- `lead_id` is `UNIQUE` — one row per lead, safe to join or upsert against from the PropIQ side too.
- `signals` (`[{key, label, value}]`) is the human-readable form for display; `raw` (`{peakCost, removals, grows, shrinks, upgrades, financing, bedrooms, finishMult, furnitureSpend, budgetBand, hasPool, stylePack}`) is the form for programmatic filtering/scoring, kept deliberately separate from `signals` so PropIQ doesn't have to parse prose.
- `score_breakdown` documents exactly how `lead_score` was assembled for that specific row — useful if PropIQ ever wants to re-weight or explain a score rather than just display it.
- Rows are written by `POST /api/leads` and (idempotently) by `server/scripts/backfillSignals.js` — PropIQ should treat this table as read-only.

## 7. Verification (all 4 acceptance criteria, shown output)

Driven directly through the API (`POST /api/events` with a hand-crafted, fully-known event sequence) rather than the flaky drag-and-drop UI automation documented in prior phases — this makes tracing signals back to specific events more precise, not less, since the exact events sent are known up front.

**1. Traceability.** Sent for one session: `shell_chosen` (maisonette/2 floors/stone), four `room_added` (pool, two bedrooms, one master), a `room_resized` on one bedroom that shrinks it, a `room_removed` on the other bedroom, `finish_changed` upgrades on the master and the remaining bedroom, a `furniture_changed` upgrade on the pool (loungers), and a `financing_answered` (mortgage). Hand-calculated the expected peak cost (before the shrink/removal: pool 3.24M + two bedrooms 1.716M each + master 2.652M + shell 5.8M = **15,124,000**) and the resulting `lead_signals` row matched exactly:

  ```json
  "raw": { "peakCost": 15124000, "removals": 1, "grows": 0, "shrinks": 1, "upgrades": 3, "financing": "Mortgage / bank financing", "bedrooms": 2, ... }
  ```

  `bedrooms: 2` (the finished design, post-removal) sitting next to `removals: 1` (the replay remembering the removed room) is a direct, concrete demonstration of "peak cost matters even after rooms are removed" working as designed. The `signals` array's `price_sensitivity` entry (`"1 shrinks, 1 removals → budget-conscious"`) and `aspiration_signal` entry (`"3 finish upgrades → aspirational, upsell-receptive"`) trace 1:1 to the exact events sent.

**2. Score formula documented.** The weight table lives in `server/lib/signals.js`'s header comment and is mirrored in §5 above. The same test lead's `score_breakdown` walked line by line: `15 (budget, mid-market) + 20 (financing, mortgage) + 0 (beds<3) + 0 (furniture spend 150K<800K) + 10 (aspiration, upgrades≥2) + 10 (premium, has pool) + 5 (lifestyle: pool loungers only) − 15 (price sensitivity) = 45`, matching `lead_score: 45` exactly.

**3. Sales page renders real rows.** `GET /api/sales/leads` returned all 4 leads newest-first; `/sales.html` screenshot shows the same data rendered — score badge, profile label, `KES` total, style pack, and the full signal list per lead.

**4. Backfill idempotency.** Ran `npm run backfill-signals` twice. Row count stayed at 4 both times, and every row's own `id` (not just `lead_id`) was identical before and after the second run — confirming the `ON CONFLICT (lead_id) DO UPDATE` path updated existing rows in place rather than inserting duplicates. The 3 leads created during Phase 4 (before `dreamhome.lead_signals` existed) went from `leadScore: null` to real scores after the first backfill run, a genuine before/after demonstration of the backfill's purpose.

## 8. Next-phase entry points

- Start Phase 6: mobile touch UX, abandonment analytics (a `session_abandoned` event plus a stage-funnel query would pair naturally with the event-replay infrastructure this phase built), performance, rate limiting, CORS, production embed, launch checklist.
- Before launch: add auth to `/sales.html` and `/api/sales/leads` (see Open Issues), and consider the `dreamhome.events` monotonic-sequence hardening (also Open Issues) if event volume grows enough for same-millisecond batches to become common.
