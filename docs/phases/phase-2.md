# Phase 2 Handoff

> Repo path: `docs/phases/phase-2.md`.
> Companion: `shared/contract.js` holds the current interface shape. This document references it; it does not duplicate it.

**Phase:** 2
**Date closed:** 2026-07-29
**One-line summary:** Game core shipped. Shell stage, plot canvas with real dnd-kit drag/move/resize/remove, floor tabs, collision, a live cost ticker, and a catalogue-driven palette all work end to end, verified with real gameplay and a DB check of the resulting events.

---

## 1. What shipped

- Endpoint: `GET /api/catalog` — returns `rooms`, `stylePacks`, `shells` from the three new catalogue tables, ordered by `sort_order`.
- Endpoint: `PATCH /api/sessions/:id` — sets `style_pack`/`floors` on the session row once the shell stage is confirmed. 404s on an unknown session id.
- Endpoint: `POST /api/events` — changed to batch shape (see contract diff). Bulk-inserts all events in one parameterized multi-row `INSERT`.
- Schema: migration `002_catalog.sql` — `dreamhome.catalog_rooms` (13 rows), `dreamhome.catalog_style_packs` (4 rows), `dreamhome.catalog_shells` (3 rows), all seeded from `dream-home-builder-v4.jsx`.
- Client: `ShellStage` (floors + style pack picker, catalogue-driven), `PlotCanvas` (dnd-kit canvas: palette-to-plot drag, existing-room move, resize via a corner handle, drag-off-canvas removal, floor tabs when `floors > 1`, collision-blocked drops, live RAF-eased cost ticker), `Palette` (renders `catalog_rooms`, ground-only items disabled off the ground floor), `CostTicker`, `RoomBlock`.
- Client: `useEventQueue` hook — in-memory batched event queue (never `localStorage`/`sessionStorage`), flushes on a 4s interval, on page hide via `sendBeacon`, and once the queue hits 20 events.
- Event taxonomy live end to end: `session_start`, `shell_chosen`, `room_added`, `room_moved`, `room_resized`, `room_removed`, `floor_viewed`.

## 2. Contract diff

- Added: `getCatalog` (`GET /api/catalog`)
- Added: `updateSessionShell` (`PATCH /api/sessions/:id`) — requires `stylePack` and `floors` together
- Changed: `logEvent` (`POST /api/events`) — **breaking change from Phase 1.** Request body is now `{ sessionId, events: [{ eventType, payload?, elapsedMs? }, ...] }` instead of a single event. Response is `{ events: [...] }` (array). Phase 1's single-event client call site no longer exists; the client only ever calls this through the batched queue now.
- Extended: `EVENT_TYPES` — added `session_start`, `shell_chosen`, `room_added`, `room_moved`, `room_resized`, `room_removed`, `floor_viewed`. `test_event` still declared, unused by the client past Phase 1.

## 3. Environment state

- Migration state: `001_init.sql` and `002_catalog.sql` both applied (`dreamhome.schema_migrations`).
- New dependency: `@dnd-kit/core`, `@dnd-kit/utilities` in `client/package.json`.
- No new env vars this phase.
- Ports and `npm run dev`/`npm run migrate` invocation unchanged from Phase 1.

## 4. Open issues / known-broken

- **Nothing broken in the shipped code.** All five acceptance criteria pass with a real play verified against the running app and the database.
- **Two real dnd-kit bugs were found and fixed during this phase**, both worth knowing about if drag behavior ever regresses:
  1. `useSensor`/`useSensors` activation-constraint options must be a referentially stable object. Passing a fresh `{ distance: 6 }` literal on every render broke dnd-kit's internal sensor memoization and tore down the active drag mid-interaction. Fixed by hoisting `ACTIVATION_CONSTRAINT` to module scope in `PlotCanvas.jsx`.
  2. The droppable's ref callback (`setCanvasRef`) must also be referentially stable. An inline arrow function recreated every render makes React call it with `null` then the node again on every render, which repeatedly unregisters/re-registers the droppable mid-drag. Fixed with `useCallback`. On top of that, `event.over` (dnd-kit's own collision result) turned out to depend on an internal droppable-rect cache that went stale relative to actual layout; `PlotCanvas.jsx` now computes drop-target overlap itself from two live `getBoundingClientRect()` reads (`rectsOverlap` in `computeTarget`) instead of trusting `event.over`.
- **Automated mouse-drag verification via this session's browser-automation tool was unreliable** and is worth flagging for whoever runs verification next: `dragstart` fired correctly and consistently, but the CDP-synthesized mouse drag's terminating pointerup never reliably reached dnd-kit's internal listener in that specific tool, even after both fixes above. This looks like a tool/extension limitation, not an app bug — real trusted browser input (confirmed via dnd-kit's `KeyboardSensor`, which is wired for accessibility via the same `useDraggable` attributes, and via the resize handle's plain `pointermove`/`pointerup` listeners) drove the exact same code paths correctly every time. `MouseSensor` and `TouchSensor` are added alongside `PointerSensor` as extra fallbacks; this doesn't fix the automation tool, but costs nothing and slightly widens real-device coverage. If a future session needs to browser-test drag-and-drop again and hits the same wall, prefer keyboard-driven interaction (Tab/click to focus a draggable, Space to pick up, arrow keys to move, Space to drop, Escape to cancel) over `left_click_drag` for this specific stack.
- Touch input specifically was not separately hardware-tested this phase (same tool limitation applies); it runs through the identical `PointerSensor` code path already verified for mouse.

## 5. Decisions and why

- **`PATCH /api/sessions/:id` writes real `style_pack`/`floors`** onto the session row when the shell stage completes, rather than leaving that solely inferable from the `shell_chosen` event. Matches the Phase 1 contract comment that anticipated this.
- **Added a `catalog_shells` table** (not named in `PROMPTS.md`'s Phase 2 spec) so floor/shell pricing is config-driven in the database like rooms and style packs, consistent with the brief's stated data principle. Confirmed with the user before building.
- **`logEvent` became a batch endpoint**, a breaking change from Phase 1, because batched client-side event logging is a stated Phase 2 requirement and reusing one endpoint for both single and batched writes is cleaner than adding a parallel endpoint.
- **Room cost has no finish/furniture multiplier yet.** `roomCost = perCellPrice * w * h` only. Finishes and furniture are explicitly Phase 3 scope; adding the multiplier now would be premature.
- **Resize stays outside dnd-kit**, using a small custom `pointerdown`/`pointermove`/`pointerup` handler scoped to the resize handle. dnd-kit has no resize primitive; this mirrors the prototype's approach for just this one interaction while everything else (palette drag, room move, drag-off-canvas removal) goes through dnd-kit as required.
- **Tap-vs-drag uses dnd-kit's `activationConstraint: { distance: 6 }`** instead of hand-rolled pointer-delta tracking. Below the threshold, no drag ever starts, so a plain `onClick` on a room still selects it — this replaces the prototype's manual `moved` flag entirely.

## 6. Next-phase entry points

- Start Phase 3: finishes with colourways, furniture sets, SVG rendering layer (textures, walls, windows, doors, garden/pool art), style-pack default floor finishes, financing prompt at the premium threshold (a new column on `catalog_style_packs`, not a hardcoded constant).
- New events for Phase 3: `finish_changed`, `colour_changed`, `furniture_changed`, `financing_answered`, `premium_crossed` — extend `EVENT_TYPES` the same way this phase did.
- No open bug to close first; go straight to the roadmap.
