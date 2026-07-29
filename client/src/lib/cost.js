export function roomCost(room, catalogRoomsByKey) {
  const rt = catalogRoomsByKey[room.type]
  if (!rt) return 0
  return Math.round(Number(rt.perCellPrice) * room.w * room.h)
}

export function shellCost(shellsByKey, shellKey) {
  const s = shellsByKey[shellKey]
  return s ? Number(s.shellCost) : 0
}

export function totalCost(placedRooms, catalogRoomsByKey, shellsByKey, shellKey) {
  const rooms = placedRooms.reduce((sum, r) => sum + roomCost(r, catalogRoomsByKey), 0)
  return shellCost(shellsByKey, shellKey) + rooms
}

export function fmtKES(n) {
  return n >= 1000000 ? `KES ${(n / 1000000).toFixed(1)}M` : `KES ${Math.round(n / 1000)}K`
}
