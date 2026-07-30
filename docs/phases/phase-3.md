# Phase 3 Handoff

> Repo path: `docs/phases/phase-3.md`.
> Companion: `shared/contract.js` holds the current interface shape. This document references it; it does not duplicate it.

**Phase:** 3
**Date closed:** 2026-07-29
**One-line summary:** Finishes, colourways, furniture sets, and the full SVG rendering layer shipped and work end to end. Style pack defaults apply and are overridable. The financing modal fires exactly once per session — confirmed directly from the database across two separate sessions.

---

## 1. What shipped

- Schema: migration `003_finishes_furniture.sql` — `dreamhome.catalog_finishes` (18 rows: 5 floor, 4 kitchen, 3 bath, 3 garden, 3 pool), `dreamhome.catalog_furniture` (23 rows across 10 room types), and three new columns on `dreamhome.catalog_style_packs` (`default_floor_finish_key`, `default_floor_color_index`, `premium_threshold`), all seeded from `dream-home-builder-v4.jsx`.
- Endpoint: `GET /api/catalog` — response grows `finishes` and `furniture` arrays; `stylePacks` rows grow the three new default/threshold fields.
- Client: `RoomArt.jsx` — full SVG rendering layer ported from the prototype: per-finish textures (tile, plank, parquet, gloss, carpet, granite) on indoor rooms, walls with window cutouts and a door arc, garden art (mowing stripes, grass blades, landscaped path with shrubs, tree clusters), pool art (coping/deck, gradient water via `<linearGradient>`, ripples, ladder, infinity-edge lip), and tier-gated furniture drawings for all 10 furnished room types.
- Client: `Picker.jsx` — Finishes/Furniture tabbed panel under the canvas, appears on room selection, auto-scrolls into view. Finish tab shows texture-preview swatches, price delta, and a colour row; furniture tab shows tier cards with cost.
- Client: `FinancingModal.jsx` — fires once per session when total crosses the active style pack's `premiumThreshold`, guarded by a ref so it never reopens even if total dips and re-crosses.
- Client: room state (`placed` entries in `PlotCanvas.jsx`) grew `finishKey`, `colorIndex`, `furnitureId`, all resolved to real defaults at placement time and independently overridable per room via the picker.
- Event taxonomy extended and live: `finish_changed`, `colour_changed`, `furniture_changed`, `financing_answered`, `premium_crossed`.

## 2. Contract diff

- No new endpoints.
- `getCatalog` response shape grew: `finishes` (`{id, groupName, key, name, mult, texture, colors}`), `furniture` (`{id, roomType, name, cost, description}`); `stylePacks` rows grew `defaultFloorFinishKey`, `defaultFloorColorIndex`, `premiumThreshold`.
- `EVENT_TYPES` extended: added `finish_changed`, `colour_changed`, `furniture_changed`, `financing_answered`, `premium_crossed`.

## 3. Environment state

- Migration state: `001_init.sql`, `002_catalog.sql`, `003_finishes_furniture.sql` all applied.
- No new dependencies, no new env vars.
- Ports and `npm run dev`/`npm run migrate` unchanged.

## 4. Open issues / known-broken

- **One real bug found and fixed during this phase**: `RoomArt.jsx`'s `<svg>` used only presentation attributes (`width`/`height`) for sizing. Inside `RoomBlock.jsx`'s flex-column wrapper, browsers resolved the SVG's CSS `width` to `0px` on the main flex axis regardless of the attribute, so every room rendered with zero visible width — floor texture, walls, and furniture existed correctly in the DOM (confirmed via exact `getBoundingClientRect` geometry matching the prototype's formulas) but nothing painted on screen. Fixed by also setting explicit CSS `width`/`height` (plus `flexShrink: 0`) in the SVG's `style` prop. Worth remembering for any future SVG-in-flex-container work in this codebase.
- **A second, smaller AC5 violation found and fixed**: `CostTicker.jsx` had its own local `PREMIUM_THRESHOLD = 18000000` constant, left over from before the threshold became per-style-pack config. It only drove the ticker's gold "premium" styling, never the actual financing trigger (that already correctly read `activePack.premiumThreshold` in `PlotCanvas.jsx`), but it was still a hardcoded catalogue value in `client/src`. Fixed by passing `premiumThreshold` down as a prop instead.
- **Nothing else broken.** All five acceptance criteria pass; see verification below.
- **Browser-automation verification was significantly hampered this phase** by environment instability beyond the app: the `computer` tool's tab identity churned repeatedly mid-session (tab IDs changed without navigation, `resize_window` broke a tab outright, `navigate` and `screenshot` calls intermittently timed out), and — separately from Phase 2's documented dnd-kit finding — this caused what looked at first like queued/backlogged input landing on the wrong tab (phantom rooms appearing that weren't just-placed, a stale ticker reading that didn't match a room's own displayed cost). None of this reproduced in clean, tightly-scoped test sequences; every clean sequence (finish changes, style-pack defaults, garden/pool rendering, the SVG-width bug itself) showed fully correct, consistent behavior. AC4 (financing modal) ended up with unusually strong evidence precisely because of this chaos: querying the database directly showed exactly one `premium_crossed` and one `financing_answered` per session across two independent sessions that both got caught up in the same unstable browser state, meaning the once-only guard held even under uncontrolled repeated interaction.
- Confirmed via database query directly rather than screenshots for AC4, since that sidesteps the browser-automation instability entirely and is more authoritative anyway.

## 5. Decisions and why

- **Furniture tier resolved by list position, not by `catalog_furniture.id`.** The prototype's `drawFurniture()` branches on a tier index (`set >= 1`, `set >= 2`), not a specific furniture identity. `RoomArt.jsx` computes `furnitureTierIndex` as the 0-based position of the room's chosen `furnitureId` within that room type's furniture list (ordered by `sort_order`), so the art tiers stay correct regardless of the underlying database id values.
- **Finish/furniture defaults resolved at placement time, stored on the room, not recomputed from the pack on every render.** Matches the prototype and satisfies "overridable per room" cleanly — a later style-pack change (there isn't one yet, but there could be) wouldn't silently rewrite an already-placed room's chosen finish.
- **Rendering-ink constants (`INK.wall`, furniture fill/stroke colors) live in `lib/theme.js`, not the API.** These are fixed art-style choices, not game data — matches the Phase 2 precedent of keeping design-system tokens client-side while catalogue *data* comes from the database.
- **`CostTicker.jsx` premium styling and `PlotCanvas.jsx`'s financing trigger now share one source of truth** (`activePack.premiumThreshold` passed down as a prop) instead of two independently-maintained values that happened to agree by coincidence.

## 6. Next-phase entry points

- Start Phase 4: consent gate becomes a proper first screen with the DPA line (no session row until consent — currently consent is already required before session creation, but the UI is still the bare Phase 1 test page, not a designed first screen), server-computed profile label and matched listings from a new `catalog_listings` table, `POST /api/designs` snapshot save, reveal card, WhatsApp lead capture via `POST /api/leads`, share-as-image export.
- No open bug to close first; go straight to the roadmap.
