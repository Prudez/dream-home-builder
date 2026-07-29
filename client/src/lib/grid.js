export const COLS = 14
export const ROWS = 10

export function computeCellSize(containerWidth) {
  return Math.max(24, Math.floor(Math.min(containerWidth, 680) / COLS))
}

export function collides(gx, gy, w, h, floorIdx, ignoreId, placedRooms) {
  return placedRooms.some((r) => {
    if (r.id === ignoreId || r.floor !== floorIdx) return false
    return gx < r.x + r.w && gx + w > r.x && gy < r.y + r.h && gy + h > r.y
  })
}

export function clampToGrid(gx, gy, w, h) {
  return {
    x: Math.max(0, Math.min(COLS - w, gx)),
    y: Math.max(0, Math.min(ROWS - h, gy)),
  }
}
