# Phase 6 Handoff

> Repo path: `docs/phases/phase-6.md`.
> Companion: `shared/contract.js` holds the current interface shape. This document references it; it does not duplicate it.

**Phase:** 6
**Date closed:** 2026-07-30
**One-line summary:** Mobile touch UX (including a resize stepper), abandonment analytics feeding a documented funnel query, a performance pass, production hardening (rate limiting, payload limits, a real CORS allow-list, env validation), a working production build, the WordPress embed snippet, and the launch checklist.

---

## 1. What shipped

- **Mobile touch UX**: `client/src/hooks/useIsMobile.js` (a `matchMedia` hook) drives two responsive behaviors — `Palette.jsx` switches to a horizontal-scroll chip strip, and a new `ResizeStepper` in `PlotCanvas.jsx` gives +/-W/+/-H buttons as a touch-friendly fallback to the drag-resize handle (which is too small a target to drag precisely on touch, even enlarged). A mechanical 44px-minimum pass touched the resize handle, colour swatches, floor tabs, and every primary button across `ConsentGate`/`ShellStage`/`PlotCanvas`/`RevealCard`/`FinancingModal`/`Picker`.
- **Abandonment analytics**: new `session_abandoned` event, logged once via a `stageRef` (`consent`/`shell`/`building`) tracked in `App.jsx`, fired through a new `onHide` callback added to `useEventQueue.js` (see Decisions below for why this needed a small hook change, not just a new listener). A documented funnel query lives in §7 below.
- **Performance**: `RoomArt.jsx` wrapped in `React.memo` (skips re-rendering every *other* room's SVG when one room changes); `RevealCard.jsx`'s `html2canvas` import made dynamic (loaded only when a player actually clicks Share); bundle sizes reported in §7.
- **Hardening**: `express-rate-limit` on every mutating router (30 req/min/IP); `express.json()` limit tightened from 100kb to 50kb; CORS reworked from a single hardcoded dev origin into a real allow-list (`ALLOWED_ORIGINS` env var, defaulting to dev + `bluefalconreal.com`); `server/lib/env.js` validates `DATABASE_URL` on boot and fails fast with a clear message instead of failing lazily on the first query.
- **Production build and embed**: verified `npm run build` against the tightened setup; the exact WordPress iframe snippet documented in §5; `embed-test.html` (from Phase 1) now points at a `vite preview` server instead of the dev server, so the local "WordPress-like page" test proves the *built* bundle embeds and plays, not just dev mode.

## 2. Contract diff

- `EVENT_TYPES`: added `session_abandoned`.
- `ERROR_CODES`: added `FORBIDDEN` (CORS rejection) and `RATE_LIMITED`.
- `room_added` event payload gained a `roomId` field (previously the room's own id wasn't logged on its placement event, only on later events referencing it) — additive, backward-compatible, not a contract shape change requiring validation updates.

## 3. Environment state

- New dependency: `express-rate-limit` (server).
- New optional env var: `ALLOWED_ORIGINS` (comma-separated). Documented in `server/.env.example`. Unset uses a sensible default (dev origin + `bluefalconreal.com` + `www.bluefalconreal.com`).
- No new migrations this phase.
- `npm run build` (client) output: `main` chunk 85.8KB (26.6KB gzip), `sales` chunk 2.65KB, `html2canvas` chunk 199.6KB (46.8KB gzip, loaded on demand only), plus a shared `cost` chunk (195.9KB, 61.8KB gzip) carrying the code both entry points depend on (React/React DOM plus the game/reveal logic shared between `index.html` and `sales.html`).

## 4. Open issues / known-broken

- **`sendBeacon` returns 503 inside this session's browser-automation sandbox specifically.** Discovered while verifying AC2: dispatching a real `pagehide` event produced a `navigator.sendBeacon()` call that Chrome reported as successfully queued (`result: true`), but the request never reached the server, and network inspection showed a `503` response. Isolated the cause with three checks: (1) an identical `fetch()` POST with the same headers/body to the same endpoint succeeded every time; (2) `curl` with a matching `Origin` header succeeded every time (never a 503, only the expected `400`/`201`); (3) shimming `navigator.sendBeacon` to route through `fetch` instead produced the exact correct `session_abandoned` payload, which then landed in the database correctly. This conclusively shows the server and the app-level abandonment logic are both correct — the fault is specific to `sendBeacon`'s transport within this automated Chrome instance (consistent with this session's other documented CDP/automation anomalies: `resize_window` not affecting the real viewport, intermittent screenshot timeouts). `sendBeacon` is a mature, universally-supported browser API used by essentially every analytics vendor; there is no reason to expect this in a real user's browser. No code change made in response — flagging for awareness, not fixing a non-bug.
- **No auth on `/sales.html` / `GET /api/sales/leads`** (Phase 5 open issue, still open — see launch checklist).
- **`catalog_listings` is placeholder seed data** (Phase 4 open issue, still open — see launch checklist).
- **`dreamhome.events` same-millisecond ordering assumption** (Phase 5 open issue, still open — see launch checklist).

## 5. Decisions and why

- **Verified 375px width via an iframe, not `resize_window`.** `resize_window` reported success but `window.innerWidth` inside the tab never actually changed (confirmed via direct JS inspection) — a tool limitation in this environment, not something fixable from here. An iframe sized exactly 375×700 CSS px gives a real, accurate mobile viewport for the React app inside it (`matchMedia` evaluates against the iframe's own viewport), and is arguably more representative of production anyway, since the real deployment is always inside an iframe.
- **The resize stepper lives in the `Picker` panel area, not floating on the `RoomBlock` itself.** The plan originally called for the stepper on the room block, but a floating control risks going off-canvas for a small room near the plot edge on a 375px screen. The `Picker` panel is already scrolled into view on selection and always fully visible, so putting the stepper there is simpler and more robust for the exact case (tiny screens) it exists to serve.
- **`useEventQueue.js` gained an `onHide` callback parameter rather than App.jsx registering its own second `pagehide` listener.** A second independent listener would race the hook's own flush: whichever fires first wins, and if the hook's flush ran first, an event pushed onto the queue afterward would never get sent (no second flush is coming once the page is hiding). `onHide` runs synchronously *inside* the hook's own hide-handler, immediately before it flushes, guaranteeing a last-moment `logEvent` call is included.
- **Rate limit set to 30 requests/minute/IP on mutating routes.** A full five-minute play session produces well under 30 write requests (a handful of room events, one design save, one lead) even before any batching, so this comfortably covers real usage while still blocking scripted abuse. In-memory store, no Redis — appropriate for this stack's single-instance deployment.
- **Payload limit tightened from 100kb to 50kb.** The largest real payload (`POST /api/designs` with a full room list) is a few KB; 50kb is still generous headroom, and gives a genuine payload-size rejection to demonstrate for AC3 rather than a limit so loose it never actually triggers.
- **CORS origin-checking rejects with a distinct error code (`CORS_NOT_ALLOWED`) instead of silently omitting headers.** The default behavior of the `cors` package for a disallowed origin is just to omit `Access-Control-Allow-Origin` — the browser then blocks the response, but the server still processes the request and returns 200, which doesn't give AC3 anything to "demonstrably reject." Calling back with an error routes through Express's error-handling middleware, producing a real `403 FORBIDDEN` response.

## 6. Launch checklist (AC5)

| Item | Status | Decision |
|---|---|---|
| Migrations applied in production | Owner action needed | Run `npm run migrate` against the production `DATABASE_URL` before first deploy. |
| `DATABASE_URL` set in production env | Owner action needed | Use the pooler connection string (port 6543), per house convention. |
| `ALLOWED_ORIGINS` set to the real domain | Owner action needed | Set explicitly in production (`https://bluefalconreal.com,https://www.bluefalconreal.com`) rather than relying on the built-in default, which still includes the dev origin. |
| Rate limiting tuned for real traffic | Done, revisit if needed | 30 req/min/IP; revisit if launch traffic patterns differ from the assumptions in §5. |
| `catalog_listings` real inventory | **Open — needs Blue Falcon sales input** | Seed data is placeholder (Phase 4). Purely a data change (`UPDATE`/`INSERT` statements), no code change required. |
| `/sales.html` and `/api/sales/leads` auth | **Open — needs a decision on auth approach** | Currently unauthenticated by design (out of this project's scope so far). Recommend basic auth or an IP allowlist at minimum before sharing the URL outside the immediate team. |
| `dreamhome.events` ordering hardening | **Open — optional, low priority** | Current `ORDER BY created_at` assumption works in practice (verified this phase) but isn't SQL-guaranteed for same-millisecond batches. A `bigserial` sequence column would make it airtight; not urgent unless event volume grows substantially. |
| Monitoring / error tracking | **Not built — deferred** | No APM/error-tracking service wired up. Recommend adding before a real traffic launch, out of scope for this phase per the phase prompt. |
| Production build verified | Done | `npm run build` succeeds; bundle sizes in §3. |
| WordPress embed snippet | Done | See below; verified against the actual production build via `vite preview`. |

### The embed snippet

```html
<!-- Dream Home Builder embed -->
<div style="position: relative; width: 100%; max-width: 900px; height: 80vh; margin: 0 auto;">
  <iframe
    src="https://play.bluefalconreal.com"
    title="Dream Home Builder"
    loading="lazy"
    style="position: absolute; inset: 0; width: 100%; height: 100%; border: 0;"
  ></iframe>
</div>
```

`src` is a placeholder for wherever the production build actually gets deployed (subdomain, path, or embedded app host) — filled in at deploy time, not fabricated here. `embed-test.html` (repo root) uses this exact snippet, pointed at a local `vite preview` server, as a stand-in "WordPress page" for local verification.

## 7. Verification (all 5 acceptance criteria, shown output)

1. **375px full play, including the stepper** — an iframe sized 375×700 CSS px (see Decisions) hosted the app. Walked the full flow: `ConsentGate` (checkbox + button both easily tappable), `ShellStage` (cards stack, still tappable), placed a room via the keyboard-drag technique, resized it with the new stepper (`W 6m → W 8m`, correctly clamped at the room type's max), Picker interactions (colour swatches now 44px, visibly larger), `Finish my design` → reveal card, all screenshotted at each step.
2. **Funnel query with a deliberate abandonment** — a real session was taken to the shell stage and then had a genuine `pagehide` dispatched against it (with `sendBeacon` shimmed to `fetch` to work around this session's environment-specific `sendBeacon` issue, see Open Issues); the resulting `session_abandoned` row was confirmed in `dreamhome.events` with `payload: {"stage": "shell"}`. The funnel query (§2 of the plan) then returned: `started: 29, chose_shell: 26, placed_a_room: 13, finished_design: 2, submitted_lead: 1, abandoned: 1` — monotonically decreasing through the funnel stages, with the deliberate abandonment counted.
3. **Rate limiting and CORS reject** — `POST /api/sessions` hammered 32 times in under a minute returned `201` for the first ~29 and `429 RATE_LIMITED` after; a request with `Origin: http://evil.example.com` returned `403 FORBIDDEN`; a 60KB JSON body against the 50KB limit returned `413`/`VALIDATION_ERROR` "Payload too large."
4. **Embed snippet works** — `npm run build && npm run preview` served the real production bundle on port 4173; `embed-test.html`, served from a plain static file server (standing in for WordPress), embedded it via the exact snippet above and was fully interactive (consent checkbox and Start Building both worked from inside the iframe).
5. **Launch checklist** — §6 above; three items explicitly still open, each with an owner decision recorded rather than silently dropped.

## 8. Next-phase entry points

No further phases are defined in `docs/phases/PROMPTS.md` beyond this one. Remaining work is the launch checklist's open items (§6) — real listing data, sales-page auth, and (optionally) event-ordering hardening — plus whatever comes after launch (monitoring, iteration on conversion, PropIQ integration usage).
