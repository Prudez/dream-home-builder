# Dream Home Builder — Photoreal Furniture Asset Manifest

Commit this as `docs/design/furniture-asset-manifest.md`. This is the source of truth for exactly what needs producing, regardless of sourcing method (AI-generated, freelance 3D artist, or self-modeled in Blender). Each physical piece is listed once and reused across every room tier or finish that includes it — the game composites pieces into configurations, so nothing here should be rendered twice.

## Universal technical spec

Every asset must follow this, or pieces will look like they came from different sources when placed together in the same room.

- **Camera angle:** top-down orthographic — looking straight down, no perspective distortion, no isometric tilt. Matches the game's plan-view canvas.
- **Lighting:** one consistent light setup across the entire set — soft key light from the upper-left, soft ambient fill, no hard directional shadows. Pick this once and hold it for every piece.
- **Shadow:** bake a soft, subtle contact shadow directly under each piece (not a separate compositing step) so it reads as "resting on the floor" the moment it's placed.
- **Background:** fully transparent, PNG with alpha channel.
- **Color grading:** consistent white balance and exposure across the whole set. This is the single biggest risk with AI-generated pieces — check it explicitly, don't assume it.
- **File format:** PNG, minimum 1024×1024px per piece, so it scales down cleanly without blurring at small room sizes.
- **Naming convention:** lowercase-hyphenated, room-prefixed — e.g. `living-sofa-base.png`, `bedroom-headboard-addon.png`, `kitchen-island.png`.
- **Real-world scale:** each piece's real-world footprint is listed in metres below, matching the game's existing 2m-per-grid-cell scale, so Claude Code can size and place pieces correctly without guessing.

## Cost-saving note before you start

Several "different" pieces can share one render — four dining chairs can be one chair asset rotated four times, both nightstands can be one asset mirrored, both sun loungers can be one asset duplicated. Flagging this now because it can cut the real piece count by 15-20% without any visible quality loss.

## Furniture pieces by room

### Living room

| Piece | Real size (approx.) | Used in | Notes |
|---|---|---|---|
| Sofa (3-seat) | 2.0m × 0.9m | Essentials and up | Core piece, highest visual priority |
| Coffee table (round) | 0.8m diameter | Essentials and up | |
| Armchair | 0.8m × 0.8m | Family Lounge and up | |
| TV console | 1.2m × 0.4m | Family Lounge and up | |
| L-sofa extension arm | 1.0m × 1.0m | Entertainer's Suite | Attaches to base sofa |
| Dining table (small, 4-seat) | 1.2m × 0.8m | Entertainer's Suite | |
| Dining chair | 0.45m × 0.45m | Entertainer's Suite | Render once, reuse ×4 |
| Bar counter | 1.5m × 0.4m | Entertainer's Suite | |
| Bar stool | 0.3m diameter | Entertainer's Suite | Render once, reuse ×2 |
| Area rug (rectangular) | Scales to room | Toggle add-on | Should tile/stretch, not fixed size |
| Wall art (framed) | 0.6m × 0.8m | Toggle add-on | Wall-mounted |
| Potted plant (indoor) | 0.4m diameter | Toggle add-on | |

### Kitchen

| Piece | Real size (approx.) | Used in | Notes |
|---|---|---|---|
| Counter run (L-shaped base) | Scales to room perimeter | All tiers | Highest priority — every kitchen has one |
| Hob/cooktop (4-burner) | 0.6m × 0.6m | All tiers | Insets into counter |
| Sink (single basin) | 0.6m × 0.5m | All tiers | Insets into counter |
| Upper cabinet run | Scales to counter run | All tiers | Wall-mounted |
| Kitchen island | 1.2m × 0.8m | Island / Chef finish tiers | |
| Breakfast table (small) | 0.9m × 0.9m | Breakfast Nook furniture tier | |
| Breakfast stool | 0.3m diameter | Breakfast Nook furniture tier | Render once, reuse ×2 |
| Pendant light | 0.3m diameter | Toggle add-on | Ceiling-mounted |

### Bedroom / Master bedroom

| Piece | Real size (approx.) | Used in | Notes |
|---|---|---|---|
| Bed frame (double/queen) | 1.5m × 2.0m | Essentials and up | Core piece, highest visual priority |
| Bed frame (king) | 1.8m × 2.0m | Master bedroom only | |
| Headboard | Matches bed width, 0.15m deep | Comfort Set+ or toggle | |
| Wardrobe | 1.2m × 0.6m | Comfort Set and up | |
| Nightstand | 0.4m × 0.4m | Comfort Set+ or toggle | Render once, reuse ×2 |
| Bedside lamp | 0.15m diameter | Toggle add-on | |
| Vanity table | 0.9m × 0.5m | Master Suite tier | |
| Vanity chair | 0.4m × 0.4m | Master Suite tier | |
| Reading/lounge chair | 0.7m × 0.7m | Master Suite tier | |
| Walk-in rail (wardrobe) | Scales to space | Luxury Suite tier | |
| Bench (foot of bed) | 1.2m × 0.4m | Luxury Suite tier or toggle | |
| Area rug (bedroom) | Scales to room | Toggle add-on | |

### Bathroom

| Piece | Real size (approx.) | Used in | Notes |
|---|---|---|---|
| Toilet / WC | 0.4m × 0.6m | All tiers | |
| Sink / vanity basin | 0.6m × 0.45m | All tiers | |
| Shower enclosure | 0.9m × 0.9m | Shower tier | |
| Bathtub | 1.7m × 0.75m | Bathtub tier | Replaces shower |
| Bath mat | 0.6m × 0.4m | Toggle add-on | |
| Wall shelf | Small, wall-mounted | Toggle add-on | |

### Office

| Piece | Real size (approx.) | Used in | Notes |
|---|---|---|---|
| Desk | 1.2m × 0.6m | Desk Setup and up | |
| Office chair | 0.6m × 0.6m | Desk Setup and up | |
| Bookshelf | 0.8m × 0.3m | Executive Study tier | |
| Guest chair | 0.6m × 0.6m | Executive Study tier | |

### Veranda

| Piece | Real size (approx.) | Used in | Notes |
|---|---|---|---|
| Outdoor chair | 0.6m × 0.6m | Seating tier | Render once, reuse ×2 |
| Potted plant (outdoor, larger) | 0.5m diameter | Seating tier | |

### Garden

| Piece | Real size (approx.) | Used in | Notes |
|---|---|---|---|
| Outdoor dining table | 1.2m × 0.8m | Alfresco Set tier | |
| Outdoor chair | 0.6m × 0.6m | Alfresco Set tier | Can reuse veranda chair |
| Fire pit (circular) | 0.8m diameter | Boma Fire Pit tier | |
| Curved bench | Pair, fits fire pit | Boma Fire Pit tier | |
| Planter (large, outdoor) | — | Toggle add-on | |
| String lights | Decorative overlay | Toggle add-on | Likely a texture overlay, not a discrete object — flag for Claude Code to decide during implementation |

### Pool

| Piece | Real size (approx.) | Used in | Notes |
|---|---|---|---|
| Sun lounger | 1.9m × 0.6m | Loungers tier | Render once, reuse ×2 |
| Pool umbrella | 1.5m diameter (canopy, top-down) | Loungers tier or toggle | |
| Pool ladder | Small, corner-mounted | Base pool feature | May stay a vector/texture detail rather than a separate asset — flag for Claude Code |

### DSQ

| Piece | Real size (approx.) | Used in | Notes |
|---|---|---|---|
| Bed (single, simple) | 1.0m × 2.0m | Furnished tier | |
| Kitchenette unit | 1.0m × 0.5m | Furnished tier | |

### Balcony

| Piece | Real size (approx.) | Used in | Notes |
|---|---|---|---|
| Railing | Scales to balcony perimeter | Included by default | |
| Small table | 0.5m × 0.5m | Balcony Lounge tier | |
| Chair | 0.4m × 0.4m | Balcony Lounge tier | Render once, reuse ×2 |
| Planter | 0.3m diameter | Balcony Lounge tier | |

### Garage

No furniture set exists for this room today — floor texture and the existing vector dashed-line marking are sufficient. No photoreal assets needed here unless that changes later.

## Textures (separate track — much easier to source than furniture)

Real, free, tileable photo textures cover this category without the consistency problems furniture has, since a texture only needs to repeat seamlessly, not match a lighting rig across dozens of objects.

- Wood plank floor — per colorway (light oak, mahogany, dark walnut)
- Ceramic/porcelain tile floor — per colorway
- Carpet — per colorway
- Grass / lawn (for garden)
- Water (for pool, if not handled procedurally)
- Stone paving / cabro (for balcony, garden paths, compound)
- Granite / stone countertop (for kitchen, bathroom finishes)

## Suggested production order

Given cost and effort, produce in this order rather than all at once:

1. **Living room + bedroom base pieces** — most-placed room types, highest visual impact for the least asset count.
2. **Kitchen + bathroom** — second most common.
3. **Garden, pool, balcony, veranda** — outdoor pieces, moderate priority.
4. **Office, DSQ** — lower placement frequency.
5. **Phase 9 toggle add-ons across all rooms** — optional flourishes, ship last since the base game works without them.

## Estimated total unique pieces

Roughly 55-60 pieces across every room type, before applying the reuse trick noted above (dining chairs, nightstands, loungers, etc. sharing one render). After reuse, realistically 45-50 unique renders needed — within the range originally estimated, and a genuinely bounded, finite list to hand to any of the three sourcing routes.
