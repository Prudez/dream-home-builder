# Phase 4 Handoff

> Repo path: `docs/phases/phase-4.md`.
> Companion: `shared/contract.js` holds the current interface shape. This document references it; it does not duplicate it.

**Phase:** 4
**Date closed:** 2026-07-30
**One-line summary:** Consent gate is a real first screen, "Finish my design" saves a snapshot and returns a server-computed profile label and matched listings, the reveal card renders a mini floorplan and captures a WhatsApp lead, and the card exports as a shareable PNG.

---

## 1. What shipped

- Schema: migration `004_designs_leads_listings.sql` — `dreamhome.catalog_listings` (6 seed rows spanning the four style packs and a range of bedroom counts/price bands), `dreamhome.designs` (session-linked snapshot + server-computed profile label/total/matched listing ids), `dreamhome.leads` (session + design-linked WhatsApp capture).
- Endpoints: `POST /api/designs` (recomputes `total` from the submitted rooms server-side — a client-sent total is never trusted — and returns `{design, matches}`), `POST /api/leads` (validates a Kenyan phone number, confirms the design belongs to the session, inserts the row).
- Backend refactor: the `GET /api/catalog` five-query `Promise.all` moved into `server/lib/catalog.js`'s `loadCatalog()`, reused by the new designs route so both endpoints build identical lookup maps from identical data.
- Shared logic: `client/src/lib/cost.js`'s pricing functions moved to `shared/cost.js` (client keeps a one-line re-export), so the server recomputes totals with the exact same math the live ticker uses — no drift between what a player sees and what gets persisted. Added `indexBy`/`groupBy` map-building helpers, used server-side.
- Client: `ConsentGate.jsx` — a proper first screen with the DPA consent line, styled to match `ShellStage.jsx`. `PlotCanvas.jsx` grew a "Finish my design →" button that assembles the placed rooms, posts to `/api/designs`, and hands the result up to `App.jsx`. `RevealCard.jsx` — modal overlay with the profile label, a mini floorplan (reusing `RoomArt.jsx` standalone at a small cell size), matched listings, inline-validated WhatsApp capture, and a "Share as image" button (`html2canvas`).
- Event taxonomy extended: `design_finished`, `lead_submitted`.

## 2. Contract diff

- New endpoints: `createDesign` (`POST /api/designs`), `createLead` (`POST /api/leads`), both with `validateRequest`.
- New exported helper: `isKenyanPhone(input)` — shared by the server's lead validation and the client's inline field feedback, so they can't drift.
- `EVENT_TYPES` extended: added `design_finished`, `lead_submitted`.

## 3. Environment state

- Migration state: `001_init.sql` through `004_designs_leads_listings.sql` all applied.
- New dependency: `html2canvas` (client only), added via `npm install` then `npm audit fix` (one transitive `postcss` advisory, patched to 8.5.25, 0 vulnerabilities remaining).
- No new env vars.

## 4. Open issues / known-broken

- **Nothing broken.** All five acceptance criteria pass; see verification below.
- **Placeholder listing data.** The six `catalog_listings` rows are seed data in the prototype's voice (its three original placeholder listings, plus three more invented the same way), tagged with style-pack/bedroom/price ranges for the matching algorithm to have something real to score against. These need to be replaced with actual current Blue Falcon inventory before launch — flagging this explicitly since it's the one piece of Phase 4 content that isn't derived from the prototype or verifiable game logic.
- **Cost-ticker easing looked like a bug during manual verification and wasn't one.** `CostTicker.jsx`'s animated counter (`d + diff * 0.15` per frame, shipped in Phase 2) eases toward the true `total` rather than jumping instantly. Screenshots taken immediately after placing a room during this phase's browser verification sometimes caught the ticker mid-convergence from the *previous* placement, which looked like an unexplained cost delta with no new room. The actual submitted total was cross-checked by hand against the resulting `dreamhome.designs` row (`3 bedrooms × 2×2 cells × KES 330K + 1 bath × 1×2 cells × KES 500K + bungalow shell KES 3.5M = KES 8,460,000`) and matched exactly, confirming this was a rendering artifact of watching the animation mid-flight, not a pricing bug.

## 5. Decisions and why

- **Total, profile label, and matches are all recomputed server-side from the submitted room list, never trusted from the client.** This is what AC3 asks for directly, but it also means a `POST /api/designs` payload can't be tampered with to inflate or deflate a design's recorded value — the same catalog data and the same `shared/cost.js` math the live ticker uses drives the persisted number.
- **`shared/cost.js` instead of duplicating pricing logic server-side.** The client's cost math was already pure, dependency-free JS; moving it to `shared/` and re-exporting from the old client path means both sides can never silently diverge, which matters more once a design's recorded `total` is what Phase 5's lead scoring will read.
- **Matching is a simple additive score (style pack match, bedroom range fit, price band fit), not a hard filter.** A build that doesn't perfectly match any listing still gets the three closest options rather than an empty list — better for a lead-capture flow where showing *something* plausible beats showing nothing.
- **The reveal card is an overlay, not a route change.** `PlotCanvas` stays mounted underneath; "Keep building" is a one-line `setShowReveal(false)`, and clicking "Finish my design" again after that creates a fresh `designs` row rather than mutating the first one — consistent with the house data principle that every finish attempt is data worth keeping, not just the final one.
- **Mini floorplan renders `RoomArt.jsx` standalone rather than a second, simplified renderer.** Confirmed during planning that `RoomArt` has no dependency on `PlotCanvas`'s drag context — it just needs `room`/`roomDef`/`finish`/`cell`, which the reveal card already has from the design snapshot and the catalog. One rendering implementation, no risk of the mini floorplan drifting visually from the live canvas.
- **`html2canvas` for the share export instead of a hand-built canvas renderer.** Reproducing `RoomArt`'s SVG drawing logic a second time against `<canvas>` primitives would have doubled the maintenance surface for every future texture/furniture change. One small, well-established dependency does the DOM-to-image conversion instead.

## 6. Verification (all 5 acceptance criteria, shown output)

1. **No network write before consent** — `read_network_requests` on a fresh load showed only `GET /api/catalog` (a read) before the consent checkbox and "Start building" click; the first `POST /api/sessions` fired only after clicking Start, confirmed in the network log.
2. **Design snapshot round-trips** — played a short game (3 bedrooms, 1 bathroom, bungalow shell, Smart Compact pack), clicked Finish, confirmed one `dreamhome.designs` row via direct query with `profile_label: "The Family Nester"`, `total: 8460000`, and a `snapshot.rooms` array matching the reveal card's displayed room count and cost exactly. Hand-verified the total: `3×(2×2×330000) + 1×(1×2×500000) + 3500000 = 8460000`.
3. **Profile label and matches computed server-side** — `grep` for every profile-label string and `matchListings`/`computeProfileLabel` against `client/src` returned no matches, confirming the client only renders `design.profileLabel`/`matches` from the API response. Traced the worked example: 3 bedroom-type rooms (2 `bedroom` + none `master`, still ≥3) → `beds >= 3` branch → "The Family Nester", confirmed both via direct `POST /api/designs` curl test and the live UI reveal card.
4. **WhatsApp validation** — in the UI, `12345` was rejected inline (Send stayed disabled, error text shown) without a network call; `0712345678` was accepted, `POST /api/leads` returned 201, and the resulting `dreamhome.leads` row was confirmed via direct query with the correct `session_id`/`design_id` link. A curl test with `12345` against the live endpoint also returned the standard `errorShape` with `VALIDATION_ERROR`.
5. **Share export produces a legible image** — clicked "Share as image" in the reveal card, confirmed `dream-home.png` (128KB) landed in the Downloads folder, and visually inspected it: profile label, summary line, mini floorplan, matched listings, and lead-confirmation state all render legibly at full card width.

## 7. Next-phase entry points

- Start Phase 5: derived-signal job reading a session's `events` and its latest `designs` row into `dreamhome.lead_signals` (budget band, finish expectation, lifestyle flags, financing readiness, lead score) — the profile-label and matching groundwork in `server/lib/profile.js` and the persisted `designs.snapshot`/`total` are the inputs that job needs.
- Replace the six placeholder `catalog_listings` rows with real current Blue Falcon inventory before launch (see Open Issues above) — purely a data change, no code change required.
