# Phase 1 Handoff

> Repo path: `docs/phases/phase-1.md`.
> Companion: `shared/contract.js` holds the current interface shape. This document references it; it does not duplicate it.

**Phase:** 1
**Date closed:** 2026-07-29
**One-line summary:** Walking skeleton shipped. Consent-gated session creation and event logging work end to end, in the browser and inside an iframe, against a real Supabase database.

---

## 1. What shipped

- Monorepo scaffold: `client/` (Vite + React), `server/` (Node + Express), `shared/` (contract), `migrations/`.
- Migration `001_init.sql`: `dreamhome.sessions` and `dreamhome.events` tables, with an index on `events.session_id`.
- Migration runner `server/scripts/migrate.js`: creates `dreamhome` schema and `dreamhome.schema_migrations` if missing, applies pending `.sql` files in order inside a transaction, tracks applied filenames so reruns are no-ops.
- Endpoint: `GET /api/health` — liveness check.
- Endpoint: `POST /api/sessions` — validates `consent` is strictly `true`, inserts a row into `dreamhome.sessions`, returns the created session.
- Endpoint: `POST /api/events` — validates `sessionId` and `eventType`, checks the session exists before insert, writes to `dreamhome.events`, returns the created event.
- Client `App.jsx`: consent checkbox, "Start session" button (disabled until consent is checked), "Log test event" button (disabled until a session exists). Renders server error shapes on failure.
- `embed-test.html`: static page that iframes the client at `http://localhost:5173`. The full consent → session → event flow works identically inside the iframe.
- 404 and 500 handlers in `server/index.js` return the contract's `errorShape` instead of an unhandled crash or a bare 500.

## 2. Contract diff

First phase, so this is the initial contract, not a diff.

- Added: `contract.health` (`GET /api/health`)
- Added: `contract.createSession` (`POST /api/sessions`) — validates `consent` (boolean, must be `true`), optional `stylePack`, `floors`, `device`
- Added: `contract.logEvent` (`POST /api/events`) — validates `sessionId`, `eventType`, optional `payload`, `elapsedMs`
- Added: `ERROR_CODES` (`VALIDATION_ERROR`, `NOT_FOUND`, `INTERNAL_ERROR`) and `errorShape()`
- Added: `EVENT_TYPES = ['test_event']` — placeholder taxonomy; grows in Phase 2 onward

## 3. Environment state

- Migration state: `001_init.sql` applied and recorded in `dreamhome.schema_migrations`. Tables confirmed present: `sessions`, `events`, `schema_migrations`.
- Env vars, server (`server/.env`): `DATABASE_URL` (Supabase pooler, port 6543), `PORT=4000`, `CLIENT_ORIGIN=http://localhost:5173`.
- Env vars, client (`client/.env`): `VITE_API_URL=http://localhost:4000`.
- Ports: server 4000, client (Vite dev) 5173.
- `npm run dev` (root) runs both via `concurrently`. `npm run migrate` (root) proxies to `server/scripts/migrate.js`.
- Supabase connections use `ssl: { rejectUnauthorized: false }` in both `server/db.js` and `migrate.js`, needed for the pooler's certificate.
- This phase added `"type": "module"` to the root `package.json`. Without it, `node --watch index.js` printed a `MODULE_TYPELESS_PACKAGE_JSON` warning every start because `shared/contract.js` uses ESM syntax but sat outside any package.json declaring `"type": "module"`. Startup is now warning-free.

## 4. Open issues / known-broken

Nothing is broken. All five Phase 1 acceptance criteria pass:

1. `npm run dev` starts client and server cleanly, no errors or warnings.
2. Consenting and starting a session creates a row in `dreamhome.sessions` (verified via direct query).
3. Logging a test event creates a row in `dreamhome.events` with the correct `session_id` (verified via direct query).
4. `embed-test.html` renders the client in an iframe and the full flow works there too (verified visually and via a DB query tied to the session created inside the iframe).
5. Contract violations (`consent: false`, and an event against a nonexistent `sessionId`) return `400` with the standard `errorShape`, not a 500.

Two non-blocking notes for later phases:

- `node --watch` restarted once spuriously a few seconds into the very first `npm run dev` of this session, then stayed stable through the rest of testing. Not reproduced on the second clean start. Worth a glance if dev-server flakiness shows up again, but not treated as a bug.
- `embed-test.html` was verified using a throwaway one-off static file server, not a permanent script. There's no `npm` script yet for serving that file standalone; not required by this phase's acceptance criteria, but a candidate for a small dev convenience script later.

## 5. Decisions and why

- **Schema creation lives in `migrate.js`, not in `001_init.sql`.** `CREATE SCHEMA IF NOT EXISTS dreamhome` runs once in the migration runner before any file is applied, so individual migration files never need to re-declare the schema.
- **Consent must be exactly `true`, not merely present.** Matches the brief's "consent first, no contact capture before consent" principle. A session row is proof of consent, so the check is strict.
- **Event insert checks session existence explicitly and returns a `VALIDATION_ERROR`,** rather than letting the foreign key constraint fail and surface as a generic 500. Keeps every client-facing failure on the contract's error shape.
- **Root `package.json` gained `"type": "module"`.** The shared contract file already uses ESM `import`/`export`; declaring the type at the root removes Node's per-file reparse warning without touching `server/` or `client/`, which already declare their own module types.

## 6. Next-phase entry points

- Start Phase 2: shell stage (floors + style pack choice) and the plot canvas, per `docs/phases/README.md` and `docs/phases/PROMPTS.md`.
- New migration for `catalog_rooms` and `catalog_style_packs`, seeded with prices from `dream-home-builder-v4.jsx`, served via `GET /api/catalog`.
- Client palette must render from the API response, not hard-coded data, from the start.
- No open issue to close first; go straight to the roadmap.
