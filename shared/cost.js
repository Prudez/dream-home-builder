// Cost math shared between the client (live ticker) and the server
// (design-save recompute, so a client-sent total is never trusted).

export function resolveFinish(room, roomDef, finishesByGroupKey) {
  if (!roomDef?.groupName) return null
  const group = finishesByGroupKey[roomDef.groupName]
  if (!group) return null
  const key = room.finishKey ?? Object.keys(group)[0]
  return group[key] ?? null
}

export function resolveFurniture(room, furnitureById) {
  if (room.furnitureId == null) return null
  return furnitureById[room.furnitureId] ?? null
}

// Toggleable add-ons (Phase 9): independent of the base furniture tier, so
// resolved separately rather than folded into resolveFurniture.
export function resolveAddons(room, addonsByType) {
  if (!room.addons || room.addons.length === 0) return []
  const list = addonsByType?.[room.type] ?? []
  if (list.length === 0) return []
  const byKey = Object.fromEntries(list.map((a) => [a.addonKey, a]))
  return room.addons.map((k) => byKey[k]).filter(Boolean)
}

export function addonsCost(room, addonsByType) {
  return resolveAddons(room, addonsByType).reduce((s, a) => s + Number(a.price), 0)
}

export function roomCost(room, catalogRoomsByKey, finishesByGroupKey, furnitureById, addonsByType = {}) {
  const rt = catalogRoomsByKey[room.type]
  if (!rt) return 0
  const finish = resolveFinish(room, rt, finishesByGroupKey)
  const mult = finish ? Number(finish.mult) : 1
  const furniture = resolveFurniture(room, furnitureById)
  const furnitureCost = furniture ? Number(furniture.cost) : 0
  return Math.round(Number(rt.perCellPrice) * room.w * room.h * mult) + furnitureCost + addonsCost(room, addonsByType)
}

export function shellCost(shellsByKey, shellKey) {
  const s = shellsByKey[shellKey]
  return s ? Number(s.shellCost) : 0
}

export function totalCost(placedRooms, catalogRoomsByKey, finishesByGroupKey, furnitureById, shellsByKey, shellKey, addonsByType = {}) {
  const rooms = placedRooms.reduce((sum, r) => sum + roomCost(r, catalogRoomsByKey, finishesByGroupKey, furnitureById, addonsByType), 0)
  return shellCost(shellsByKey, shellKey) + rooms
}

export function fmtKES(n) {
  return n >= 1000000 ? `KES ${(n / 1000000).toFixed(1)}M` : `KES ${Math.round(n / 1000)}K`
}

// Map-building helpers for turning flat catalog rows into lookup maps,
// needed server-side (server/routes/designs.js) the same way PlotCanvas.jsx
// already builds them client-side via useMemo.
export function indexBy(rows, keyField) {
  const out = {}
  for (const row of rows) out[row[keyField]] = row
  return out
}

export function groupBy(rows, keyField) {
  const out = {}
  for (const row of rows) {
    const k = row[keyField]
    if (!out[k]) out[k] = []
    out[k].push(row)
  }
  return out
}
