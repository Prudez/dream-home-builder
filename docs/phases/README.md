# Dream Home Builder — Project Brief

Commit this file as `docs/phases/README.md`. It is the standing brief. A fresh chat reads this file, the latest `docs/phases/phase-N.md`, and `shared/contract.js`, then continues the project without re-briefing.

## What the app is

Dream Home Builder is a gamified lead-capture tool for Blue Falcon Real Estate. A visitor designs their dream home in about five minutes: pick floors and a style pack, drag and resize rooms on a plot, choose finishes, colours, and furniture sets, then get a shareable profile with matched Blue Falcon listings and a WhatsApp capture step.

The game is the survey. Every interaction is an event: placements, resizes, removals, finish upgrades, financing answers. The backend derives buyer signals from those events (budget band, household size, finish expectation, lifestyle, financing readiness) and turns players into scored leads for the sales team.

A working interactive prototype exists (`dream-home-builder-v4.jsx`). It is the design spec for game mechanics, data signals, and visual style. The production build is a fresh implementation, not a port of the prototype file.

## Stack and conventions

- Frontend: Vite + React. Drag and drop uses `dnd-kit` with pointer sensors, not hand-rolled pointer math. Room rendering is SVG (textures, furniture sets, garden and pool art) as proven in the prototype.
- Backend: Node + Express.
- Database: Supabase Postgres via node-postgres Pool on port 6543 (Transaction pooler). All tables live in a dedicated `dreamhome` schema. Parameterized queries only. Async DB helpers, no sync calls.
- Contract: `shared/contract.js` is the single source of truth for every endpoint shape. Both sides import it. Backend validates at the boundary. See the api-contract skill and `references/conventions.md`.
- Environment: Windows + PowerShell. Known quirks from PropIQ apply: kill zombie Node processes with `taskkill /F /IM node.exe` before restarting; the frontend needs `VITE_API_URL` set or requests hit the wrong port. Secrets follow the api-keys skill: names and placement in `.env`, never real values in the repo or chat.
- Deployment target: embedded on bluefalconreal.com (WordPress) via iframe pointing at the hosted Vite app.

## Working method

The app is built in phases. Each phase ends with a committed `docs/phases/phase-N.md` handoff (what shipped, contract diff, environment state, open issues, decisions, next entry points). The contract file carries the durable API state; handoffs record diffs and loose threads. Open issues never carry forward silently.

House prose style in all docs: active voice, short paragraphs, no em dashes, no filler.

## Data principles

- Log events, not just final state. Peak cost matters even after rooms are removed. Hesitation and abandonment are data.
- Room, finish, and furniture catalogues are config in the database, not hard-coded in the client, so sales can tune prices and options without a deploy.
- Consent first. The game opens with a short Data Protection Act consent line ("we use your answers to recommend properties"). Store the consent flag with the session. No contact capture before consent.
- Signals stay interpretable. Every derived signal maps to a plain-language sales insight, as in the prototype's sales-team view.

## Core schema (detail lives in migrations and the contract)

- `dreamhome.sessions` — one row per play session: consent flag, style pack, floors, device, timestamps.
- `dreamhome.events` — append-only event log: session id, event type, payload jsonb, elapsed ms.
- `dreamhome.designs` — final design snapshot per session as jsonb.
- `dreamhome.leads` — contact captures: WhatsApp number, session id, matched listings shown.
- `dreamhome.lead_signals` — derived signals per session (budget band, finish tier, lifestyle flags, financing readiness), written by the signal job in Phase 5.
- `dreamhome.catalog_*` — rooms, finishes, colours, furniture sets, style packs, with prices.

## Phase roadmap

- [x] **Phase 1 — Walking skeleton.** Monorepo scaffold (client, server, shared). `shared/contract.js` with health, create-session, and log-event endpoints. `dreamhome` schema migration for `sessions` and `events`. One end-to-end proof: page loads, session row created, a test button writes an event, row visible in Supabase. Local iframe embed test. Closed 2026-07-29, see `docs/phases/phase-1.md`.
- [x] **Phase 2 — Game core.** Shell stage (floors + style packs) and the plot canvas: drag from palette, move, resize with dnd-kit, floor tabs, collision, live cost ticker. Catalogue tables seeded and served from the API. Every interaction posts batched events. Closed 2026-07-29, see `docs/phases/phase-2.md`.
- [x] **Phase 3 — Customization and rendering.** Finishes with colourways, furniture sets, SVG textures and furniture art, garden and pool rendering, style-pack defaults, financing prompt at the premium threshold. Event taxonomy finalized and documented in the contract. Closed 2026-07-29, see `docs/phases/phase-3.md`.
- [x] **Phase 4 — Reveal and lead capture.** Server-computed profile label and matched listings. Consent gate at game start. Lead capture endpoint (WhatsApp number), design snapshot saved, shareable summary card. Closed 2026-07-30, see `docs/phases/phase-4.md`.
- [x] **Phase 5 — Signals and integration.** Derived-signal job writing `lead_signals`. Sales view of leads with signals, either a small admin page or a feed into the PropIQ dashboard, which reads the same Supabase instance. Basic lead scoring. Closed 2026-07-30, see `docs/phases/phase-5.md`.
- [x] **Phase 6 — Polish and launch.** Mobile touch UX (larger resize targets, plus/minus size fallback), abandonment analytics, performance pass, rate limiting, env hardening, production iframe embed on bluefalconreal.com, launch checklist. Closed 2026-07-30, see `docs/phases/phase-6.md`.
- [x] **Phase 7 — Balcony room and front elevation.** New Balcony room type (upper-floors-only, finishes, furniture, RoomArt rendering, an outdoor-space lifestyle signal). Front-elevation SVG render on the reveal card, deriving floor widths from placed rooms and roof shape from the style pack. Closed 2026-08-04, see `docs/phases/phase-7.md`.
- [x] **Phase 8 — Freeform resize and free rotation.** Per-room-type min/max sizes removed in favor of a universal 1x1-cell floor and the plot itself as the ceiling. Rooms can now rotate to any angle via a drag handle, rendered as a single SVG transform, with real rotated-rectangle (SAT) collision detection. Closed 2026-08-04, see `docs/phases/phase-8.md`.
- [x] **Phase 9 — Furniture piece toggles.** Per-room-type add-on checklist (rug, TV console, headboard, bar stools, and similar flourish pieces) layered independently on top of the base furniture tier, its own catalog table and cost term, conditional SVG rendering, an `addon_toggled` event, and a detail-oriented engagement signal for 3+ add-ons enabled on one room. Closed 2026-08-05, see `docs/phases/phase-9.md`.

## Resume protocol

A fresh chat, in order:

1. Read this file.
2. Read the latest `docs/phases/phase-N.md` and `shared/contract.js`.
3. Restate where things stand in a few sentences.
4. Surface open issues before proposing new work.
5. Start the next roadmap phase. Confirm only genuine forks.

## Phase kickoff prompts

Paste one of these into a fresh chat. After Phase 1 exists, the short form works because the repo carries the state.

**Phase 1 (first chat, no prior state):**

> We are starting Phase 1 of Dream Home Builder. Read docs/phases/README.md in this repo for the brief. Scaffold the monorepo (client: Vite/React, server: Node/Express, shared: contract file per my api-contract skill). Write the migration for the dreamhome schema with sessions and events tables. Implement POST /api/sessions and POST /api/events per the contract, validated at the boundary. Prove the walking skeleton end to end: page load creates a session, a test button logs an event, and the row shows in Supabase. Follow my conventions: Windows/PowerShell, pooler port 6543, parameterized queries, VITE_API_URL set. Close the phase with docs/phases/phase-1.md per my phase-handoff skill.

**Phase 2:**

> Continue Dream Home Builder. Start Phase 2 per the roadmap: shell stage, plot canvas with dnd-kit drag/move/resize, floor tabs, live cost ticker, catalogue tables seeded and served from the API, batched event logging for every interaction. Use dream-home-builder-v4.jsx as the mechanics spec. Close with the phase handoff.

**Phase 3:**

> Continue Dream Home Builder. Start Phase 3: finishes with colourways, furniture sets, SVG textures and furniture rendering, garden and pool art, style-pack defaults, financing prompt. Finalize the event taxonomy in the contract. Close with the phase handoff.

**Phase 4:**

> Continue Dream Home Builder. Start Phase 4: consent gate, server-computed profile and matched listings, lead capture endpoint, design snapshot, shareable summary card. Close with the phase handoff.

**Phase 5:**

> Continue Dream Home Builder. Start Phase 5: derived-signal job into lead_signals, sales view of scored leads, PropIQ integration path. Close with the phase handoff.

**Phase 6:**

> Continue Dream Home Builder. Start Phase 6: mobile touch UX, abandonment analytics, performance, rate limiting, env hardening, production embed on bluefalconreal.com, launch checklist. Close with the phase handoff.

After the first handoff exists, a bare "Continue" is also a complete instruction.
