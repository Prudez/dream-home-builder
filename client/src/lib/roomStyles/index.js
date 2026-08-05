// Style-renderer registry (Phase 10). A "style" is a complete, swappable
// visual language for room art — every style module implements the same
// interface, documented below, so RoomArt.jsx can dispatch to whichever one
// is active without knowing anything about how it draws. Switching styles
// changes only how a room's existing type/finish/furniture/addon/rotation
// selections are drawn — none of that underlying data changes or is
// style-specific, so a style module never reads or writes room state.
//
// Interface every style module default-exports:
//
//   key: string    — stable id (e.g. 'soft-depth'), used as the style's
//                     identity everywhere (switcher UI, style_changed event
//                     payload). Never renamed once shipped.
//   name: string    — display name for the switcher UI.
//
//   drawFloor({ room, roomDef, W, H, cell, finish, color, rand })
//     -> array of SVG children. The room's background: either a no-finish
//     utility rendering (gate/borehole/garage, or any other groupless room
//     with no catalog finish — e.g. veranda) OR the generic textured floor
//     for every indoor/textured finish group (living/kitchen/bath/office/
//     bedroom/master/dsq/balcony). Also responsible for balcony's always-on
//     baluster railing (its only edge treatment, appended after the floor
//     texture — balconies are never `indoor` so drawWalls never fires for
//     them). NOT called when roomDef.groupName is 'pool' or 'garden' —
//     those get their own hooks below, since their rendering is a
//     structurally different thing (water, decking, grass, landscaping),
//     not a variation on "floor with a texture pattern."
//
//   drawPool({ room, roomDef, W, H, finish, color, rand })
//     -> array of SVG children. Called only when roomDef.groupName === 'pool'.
//
//   drawGarden({ room, roomDef, W, H, finish, color, rand })
//     -> array of SVG children. Called only when roomDef.groupName === 'garden'.
//
//   drawFurniture({ type, W, H, tier, finishKey })
//     -> array of SVG children. The room's base furniture tier (Essentials /
//     Family Lounge / etc.), keyed by room type. `tier` is the 0-based
//     position of the room's chosen catalog_furniture row within that room
//     type's furniture list — the same `furnitureTierIndex` RoomArt has
//     always been passed.
//
//   drawAddons({ type, W, H, addons })
//     -> array of SVG children. Phase 9's toggleable furniture add-ons,
//     `addons` being the room's own `addons: string[]` of enabled
//     addon_key values. Independent of `drawFurniture`'s tier — both are
//     always called and their output layered together.
//
//   drawWalls({ room, roomDef, W, H, color })
//     -> array of SVG children. Indoor wall + window + door outline, only
//     when roomDef.indoor. Drawn last, on top of furniture (matching the
//     original single-path RoomArt's z-order). Empty array for every
//     non-indoor room type — balcony's edge treatment lives in drawFloor
//     (see above), and outdoor rooms (garden/pool/veranda) have no wall at
//     all.
//
// `rand` passed into drawFloor/drawPool/drawGarden is the already-seeded
// generator function for this room (see client/src/lib/svgHelpers.js —
// seeded from the room's id so texture speckle/tree placement stays stable
// across re-renders), not a raw seed — call it directly, e.g. `rand()`.
//
// RoomArt.jsx owns everything style-independent: the outer <svg>/viewBox/
// overflow, and the single <g transform="rotate(...)"> wrapping every
// style's output — no style module ever touches rotation.

import softDepth from './softDepth.jsx'
import lineArt from './lineArt.jsx'

export const ROOM_STYLES = {
  [softDepth.key]: softDepth,
  [lineArt.key]: lineArt,
}

// Ordered for the switcher UI.
export const STYLE_LIST = [softDepth, lineArt]

export const DEFAULT_STYLE_KEY = softDepth.key

export function getStyle(styleKey) {
  return ROOM_STYLES[styleKey] ?? ROOM_STYLES[DEFAULT_STYLE_KEY]
}
