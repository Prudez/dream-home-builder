# Dream Home Builder — Code and Design Prompts

Commit this as `docs/phases/PROMPTS.md`, next to the brief. The brief (`docs/phases/README.md`) holds the roadmap; this file holds the working prompts. Code prompts run in Claude Code inside the repo. Design prompts run in a chat or design session and reference the design system below.

---

## Part 1 — Standing rules block

Paste this once at the start of any code session, before the phase prompt. It encodes the house rules so no session drifts.

> Operating rules for this repo:
> 1. Contract first. Read shared/contract.js before touching any route or fetch. Define or change shapes there first. Backend validates requests and responses at the boundary. Frontend never redefines shapes inline.
> 2. Read docs/phases/README.md and the latest docs/phases/phase-N.md before writing code. Surface open issues before new work.
> 3. Database: Supabase Postgres, pooler port 6543, all tables in the dreamhome schema, parameterized queries only, async helpers.
> 4. Environment: Windows PowerShell. Use PowerShell syntax for commands. If a port is stuck, kill zombie Node with taskkill /F /IM node.exe. The client requires VITE_API_URL in .env.
> 5. Secrets: names and placement only, per the api-keys skill. Never ask me to paste a real key. Never commit a value.
> 6. Never use localStorage or sessionStorage in the client. Session identity lives in React state and the server.
> 7. Verify before claiming done. Run it, show the output, then say it works.
> 8. Close every phase with docs/phases/phase-N.md per the phase-handoff skill.

---

## Part 2 — Claude Code prompts per phase

Run each after the standing rules block. Each prompt ends with acceptance criteria; the phase is not done until every criterion passes with shown output.

### Phase 1 — Walking skeleton

> Start Phase 1. Scaffold the monorepo: client/ (Vite + React), server/ (Node + Express), shared/ (contract.js from my api-contract skill template, adapted). Write migration 001 creating the dreamhome schema with sessions (id, consent boolean, style_pack, floors, device, created_at) and events (id, session_id, event_type, payload jsonb, elapsed_ms, created_at). Implement POST /api/sessions and POST /api/events per the contract, validated at the boundary. Client: a bare page that creates a session on load (after a consent checkbox) and has one test button that logs a test event. Add embed-test.html, a plain page that iframes the client, to prove embedding works.
>
> Acceptance criteria:
> 1. npm run dev starts client and server on their configured ports with no errors.
> 2. Loading the client with consent checked creates one row in dreamhome.sessions. Show the row.
> 3. Clicking the test button creates one row in dreamhome.events with the session id. Show the row.
> 4. embed-test.html renders the client in an iframe and the flow still works.
> 5. A request that violates the contract returns the standard error shape, not a 500. Show one example.

### Phase 2 — Game core

> Start Phase 2. Build the shell stage (floors choice, style pack choice) and the plot canvas. Use dnd-kit with pointer sensors for drag from palette, move, and resize; grid snap; collision; floor tabs when floors > 1; live animated cost ticker. Mechanics spec is dream-home-builder-v4.jsx in the repo root: match its grid model (14x10, 2m cells), min/max room sizes, ground-only outdoor items, and tap-to-select behavior, including its tap-vs-drag movement threshold fix. Create catalogue migrations and seed: catalog_rooms, catalog_style_packs, with prices from the prototype. Serve them via GET /api/catalog per the contract. The client renders the palette from the API, never from hard-coded data. Batch events client-side and flush to POST /api/events every few seconds and on page hide: session_start, shell_chosen, room_added, room_moved, room_resized, room_removed, floor_viewed, with payloads matching the prototype's event log.
>
> Acceptance criteria:
> 1. A full play (choose shell, place, move, resize, remove rooms across floors) works by mouse and by touch emulation with no console errors.
> 2. A tap on a room selects it and never removes it.
> 3. The ticker equals shell cost plus per-cell room costs from the catalogue. Show one worked example.
> 4. dreamhome.events contains the batched events for a test play in order with sensible elapsed_ms. Show a sample.
> 5. Changing a price in catalog_rooms changes the game with no client redeploy.

### Phase 3 — Customization and rendering

> Start Phase 3. Add finishes with colourways and furniture sets, both as catalogue tables (catalog_finishes, catalog_furniture) seeded from the prototype's data, served in GET /api/catalog. Build the tabbed picker (Finishes | Furniture) that appears on room selection and auto-scrolls into view. Implement the SVG rendering layer from the prototype: per-finish textures (tile, plank, parquet, gloss, carpet, granite, grass, water), walls with window cutouts and door arcs on indoor rooms, furniture set drawings, garden art (organic edge, mowing stripes, trees, landscaped path, boma fire pit), pool art (coping deck, gradient water, ripples, ladder, loungers, infinity edge). Style packs set default floor finishes. Financing prompt fires once when total crosses the premium threshold (a value in catalog_style_packs config, not a constant). New events: finish_changed, colour_changed, furniture_changed, financing_answered, premium_crossed.
>
> Acceptance criteria:
> 1. Every finish and colourway visibly changes its room. Screenshot three examples including one garden and one pool state.
> 2. Furniture sets redraw the room and price into the ticker.
> 3. Style pack defaults apply on placement and are overridable per room.
> 4. The financing modal fires exactly once per session and its answer lands in events.
> 5. All new option data comes from the API; grep confirms no catalogue values hard-coded in client/src.

### Phase 4 — Reveal and lead capture

> Start Phase 4. Consent gate becomes a proper first screen with the DPA line; no session row until consent. On finish: POST /api/designs saves the full design snapshot (jsonb) and returns a server-computed profile (label logic from the prototype) plus matched listings from a new catalog_listings table seeded with current Blue Falcon listings. Build the reveal card: profile label, style pack, cost, mini rendered floorplan, matched listings, WhatsApp capture field posting to POST /api/leads (validate Kenyan number formats). Add a share action that exports the card as an image client-side.
>
> Acceptance criteria:
> 1. No network write of any kind happens before consent. Show the network log.
> 2. Finishing a play creates one row in dreamhome.designs whose jsonb round-trips back into the reveal card.
> 3. Profile label and matches are computed server-side; the client only renders them.
> 4. A valid WhatsApp number creates a lead row linked to the session; an invalid one gets the standard error shape.
> 5. The share export produces a legible image of the card.

### Phase 5 — Signals and integration

> Start Phase 5. Build the signal job: a server task that reads a session's events and design and writes one row to dreamhome.lead_signals with the derived signals from the prototype's sales-team view (budget band from peak cost, household size, finish expectation as area-weighted multiplier, splurge rooms, lifestyle flags including entertainer, WFH, furnished DSQ, price sensitivity from shrinks and removals, financing readiness, plus a simple 0-100 lead score with documented weights). Run it on lead creation and backfill on demand. Build GET /api/sales/leads returning leads joined with signals, and a minimal internal sales page listing scored leads newest first with plain-language signals. Document how PropIQ reads dreamhome.lead_signals directly, since it shares the Supabase instance.
>
> Acceptance criteria:
> 1. A completed test play with a lead produces a lead_signals row whose values I can trace back to specific events. Walk one example through.
> 2. The score formula is documented in the code and the phase doc.
> 3. The sales page renders real rows from the API.
> 4. Backfill is idempotent; running it twice does not duplicate rows.

### Phase 6 — Polish and launch

> Start Phase 6. Mobile pass: minimum 44px touch targets, plus/minus size stepper as a resize fallback on small screens, palette as horizontal scroll, test at 375px width. Abandonment analytics: session_abandoned event on page hide before finish, and a stage funnel query documented in the phase doc. Performance: bundle check, memoized SVG rendering, event batch tuning. Hardening: rate limiting on all POST routes, payload size limits, CORS restricted to bluefalconreal.com and the app origin, env validation on boot per the api-keys skill. Production build and the exact WordPress iframe embed snippet. Write the launch checklist into the phase doc.
>
> Acceptance criteria:
> 1. Full play works at 375px width by touch, including resizing via the stepper.
> 2. Funnel query returns believable numbers for test sessions, including one deliberate abandonment.
> 3. Rate limiting and CORS demonstrably reject what they should. Show one rejected request each.
> 4. The embed snippet works in a local WordPress-like page.
> 5. Launch checklist complete; no open issues, or each one is listed with an owner decision.

---

## Part 3 — Design prompts

### The design system (source of truth for every design prompt)

> Blue Falcon Dream Home Builder design system:
> Palette: deep navy #0A1E3C (primary surfaces, headers), mid navy #13315C, ink #0B0B0D (ticker bar), paper #F5F6F8 (app background), white, gold #C9A14A with deep gold #A97F2C (accent, selection, CTAs, premium states), green #4E7A57 (valid states, garden), danger #B4453A (invalid states). Never introduce colours outside this set except inside room artwork.
> Typography: bold uppercase sans-serif display for headings with slight letterspacing; small uppercase letterspaced eyebrows in gold; body 13px regular. Numbers in the ticker are tabular.
> Shape language: 6-10px radii, thin #DDE2E9 borders on cards, gold 2px border plus warm tint for selected states, soft navy-tinted shadows.
> Tone: premium but playful. The interface is a game, not a form. Kenyan market specificity is a feature: KES pricing, DSQ, boma, cabro, Kikuyu grass.
> Layout: sticky ticker bar always visible; palette left, plot canvas right on desktop; stacked with horizontal-scroll palette on mobile; picker panel appears under the canvas on selection.

### D1 — UI polish pass (run against the Phase 2-3 build)

> Using the design system above, do a visual polish pass on the game screens. Review shell stage cards, palette chips, canvas, floor tabs, picker panel, financing modal. Tighten spacing to a 4px grid, unify radii and borders, check contrast of all text on navy and on gold, design empty states for each floor and hover/active/disabled states for every interactive element. Deliver: annotated before/after notes per screen and the exact CSS token changes. Do not introduce new colours or fonts.

### D2 — Reveal card and share image (feeds Phase 4)

> Using the design system above, design the reveal card in two artboards: in-app card (440px wide) and shareable image (1080x1920, WhatsApp status friendly). Contents: Blue Falcon eyebrow, profile label as the hero in bold uppercase, one-line build summary (floors, style pack, rooms, KES total), a mini top-down floorplan render as the centrepiece, up to three matched listings, WhatsApp capture (in-app only), Blue Falcon contact strip (share image only). The share image must make a stranger want to play: lead with the floorplan and the label, keep listings secondary. Deliver a layout spec with exact positions and sizes that a developer can implement in SVG or canvas.

### D3 — Room and texture art direction (feeds Phase 3)

> Using the design system above, art-direct the SVG room rendering. Style target: clean architect's illustration, not realism; the prototype dream-home-builder-v4.jsx is the baseline. For each finish texture (tile, plank, parquet, gloss, carpet, granite) specify stroke opacity, spacing relative to cell size, and how each reads at 24px cells on mobile. For furniture sets, specify the two-tone scheme (white fills, dark navy transparents) and minimum room sizes for each element to draw. For garden and pool, specify tree cluster construction, path curvature, water gradient stops, and ripple placement. Deliver: a one-page art spec with a small reference sketch per texture.

### D4 — Launch marketing kit (Canva, after Phase 6)

> The Dream Home Builder game is live on bluefalconreal.com. Create launch assets with my canva-marketing-designs skill and house style: deep navy, white, black, bold uppercase sans-serif, photo-forward. One Instagram Reel cover (9:16): headline DESIGN YOUR DREAM HOME, subline Play the 5-minute builder, see homes that match, screenshot of the game canvas as hero, CTA strip with the site URL. One Facebook post (1:1) and one Twitter/X card (16:9) with the same message adapted per platform. Write the captions with the real-estate-marketing skill, Kenyan market framing, and a hook about designing your own boma.

---

## How these fit together

Design prompts D1 and D3 run alongside Phase 3; D2 runs just before Phase 4; D4 runs after Phase 6. Each design output gets committed to docs/design/ so code sessions can reference it by file, the same way they reference the contract.
