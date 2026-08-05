export const COLS = 14
export const ROWS = 10

// Freeform resize (Phase 8): per-room-type min/max sizes no longer exist
// in the catalog. The only remaining size floor is universal, so a room
// can never render at zero or negative size; the only ceiling is the plot
// itself (COLS/ROWS), applied at each call site relative to the room's
// current x/y.
export const MIN_ROOM_CELL = 1

export function computeCellSize(containerWidth) {
  return Math.max(24, Math.floor(Math.min(containerWidth, 680) / COLS))
}

// Rectangle corners in grid-cell space, centered at (cx, cy), rotated by
// rotationDeg around that center. Used by the SAT collision check below.
function rectCorners(cx, cy, w, h, rotationDeg) {
  const rad = (rotationDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const hw = w / 2
  const hh = h / 2
  const local = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ]
  return local.map(([lx, ly]) => [cx + lx * cos - ly * sin, cy + lx * sin + ly * cos])
}

// A rectangle has only 2 unique edge-normal axes (opposite edges are
// parallel) — the first two corners are enough for a full SAT test.
function rectAxes(corners) {
  const axes = []
  for (let i = 0; i < 2; i++) {
    const [x1, y1] = corners[i]
    const [x2, y2] = corners[i + 1]
    const edgeX = x2 - x1
    const edgeY = y2 - y1
    const len = Math.hypot(edgeX, edgeY) || 1
    axes.push([-edgeY / len, edgeX / len])
  }
  return axes
}

function project(corners, axis) {
  let min = Infinity
  let max = -Infinity
  for (const [x, y] of corners) {
    const p = x * axis[0] + y * axis[1]
    if (p < min) min = p
    if (p > max) max = p
  }
  return [min, max]
}

// Separating Axis Theorem: two convex polygons do NOT overlap iff there's
// an axis (here, one of the two rectangles' edge normals) onto which their
// projections don't overlap. Two rotated rectangles can't be tested with a
// simple bounding-box comparison — axis-aligned rects (rotation 0) are just
// the special case where the axes happen to be the grid's own X/Y axes.
function rectsIntersect(a, b) {
  const cornersA = rectCorners(a.cx, a.cy, a.w, a.h, a.rotation)
  const cornersB = rectCorners(b.cx, b.cy, b.w, b.h, b.rotation)
  const axes = [...rectAxes(cornersA), ...rectAxes(cornersB)]
  for (const axis of axes) {
    const [minA, maxA] = project(cornersA, axis)
    const [minB, maxB] = project(cornersB, axis)
    if (maxA <= minB || maxB <= minA) return false
  }
  return true
}

// gx/gy/w/h describe the candidate room's axis-aligned grid footprint
// (position always stays grid-snapped — see docs/phases/phase-8.md);
// rotation is the candidate's own visual angle, tested via SAT against
// every other placed room's footprint at *its* stored rotation.
export function collides(gx, gy, w, h, floorIdx, ignoreId, placedRooms, rotation = 0) {
  const candidate = { cx: gx + w / 2, cy: gy + h / 2, w, h, rotation }
  return placedRooms.some((r) => {
    if (r.id === ignoreId || r.floor !== floorIdx) return false
    const other = { cx: r.x + r.w / 2, cy: r.y + r.h / 2, w: r.w, h: r.h, rotation: r.rotation ?? 0 }
    return rectsIntersect(candidate, other)
  })
}

export function clampToGrid(gx, gy, w, h) {
  return {
    x: Math.max(0, Math.min(COLS - w, gx)),
    y: Math.max(0, Math.min(ROWS - h, gy)),
  }
}
