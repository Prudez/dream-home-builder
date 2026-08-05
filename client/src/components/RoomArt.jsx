import { memo } from 'react'
import { rand } from '../lib/svgHelpers.js'
import { getStyle } from '../lib/roomStyles/index.js'

// Thin dispatcher (Phase 10) — every actual drawing decision lives in the
// active style module (client/src/lib/roomStyles/*.js; see index.js for the
// interface contract). RoomArt itself only resolves the room's pixel size/
// colour, builds the shared ctx object every hook receives, and owns the
// two things that stay identical across every style: the outer <svg> and
// the single rotation transform (Phase 8) wrapping whatever the active
// style draws.
function RoomArt({ room, roomDef, cell, finish, colorIndex, furnitureTierIndex, styleKey }) {
  const W = room.w * cell
  const H = room.h * cell
  const rotation = room.rotation ?? 0
  const color = finish ? finish.colors[colorIndex]?.hex ?? finish.colors[0].hex : '#8B97A8'
  const r = rand(room.id * 7919 + 13)
  const style = getStyle(styleKey)

  const floorCtx = { room, roomDef, W, H, cell, finish, color, rand: r }
  const els = []

  if (roomDef.groupName === 'pool') {
    els.push(<g key="floor">{style.drawPool(floorCtx)}</g>)
  } else if (roomDef.groupName === 'garden') {
    els.push(<g key="floor">{style.drawGarden(floorCtx)}</g>)
  } else {
    els.push(<g key="floor">{style.drawFloor(floorCtx)}</g>)
  }

  if (!['gate', 'borehole', 'garage'].includes(room.type)) {
    els.push(<g key="furniture">{style.drawFurniture({ type: room.type, W, H, tier: furnitureTierIndex, finishKey: finish ? finish.key : null })}</g>)
    els.push(<g key="addons">{style.drawAddons({ type: room.type, W, H, addons: room.addons })}</g>)
  }

  els.push(<g key="walls">{style.drawWalls({ room, roomDef, W, H, color })}</g>)

  return (
    <svg
      width={W - 3}
      height={H - 3}
      viewBox={`0 0 ${W} ${H}`}
      style={{
        display: 'block',
        width: W - 3,
        height: H - 3,
        flexShrink: 0,
        // A rotated room's corners extend past its own 0..W/0..H viewBox
        // (e.g. a square at 45° reaches out to its diagonal) — visible
        // overflow lets that bleed past the nominal footprint instead of
        // being clipped mid-rotation. This is deliberate, not a leak: the
        // room's grid footprint (x/y/w/h) never changes, only how far its
        // drawn art visually reaches; see docs/phases/phase-8.md.
        overflow: 'visible',
        borderRadius: roomDef.groupName === 'garden' ? 14 : 6,
        pointerEvents: 'none',
      }}
    >
      {/* Rotation (Phase 8) and the floor/furniture/addons/walls ordering
          (Phase 10) are the only two things RoomArt itself controls — every
          shape inside comes from the active style's four drawing hooks,
          called above in the same z-order the single-style renderer always
          used: floor first, furniture+addons above it, walls last (on top,
          so wall lines stay crisp over furniture that reaches near an edge). */}
      <g transform={rotation ? `rotate(${rotation} ${W / 2} ${H / 2})` : undefined}>{els}</g>
    </svg>
  )
}

// Re-rendered per room on every PlotCanvas state change; PlotCanvas's
// immutable setPlaced updates only replace the object for the room that
// actually changed, so memoizing here skips redrawing every *other* room's
// SVG (walls, textures, furniture) on each interaction. `styleKey` is a
// plain prop like any other, so switching styles (which changes it on every
// visible room at once) still triggers exactly the re-renders it should.
export default memo(RoomArt)
