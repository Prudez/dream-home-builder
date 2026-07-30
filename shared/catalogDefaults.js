// Default finish/furniture resolution for a newly placed room. Shared
// between the client (assigns these at drag-drop time) and the server's
// session replay (room_added events don't carry finish/furniture, so the
// replay has to reconstruct the same defaults the client would have
// assigned, or replayed costs drift from what the player actually saw).

export function defaultFinishFor(roomDef, activePack, finishesByGroup) {
  if (!roomDef.groupName) return { finishKey: null, colorIndex: 0 }
  if (roomDef.groupName === 'floor' && activePack?.defaultFloorFinishKey) {
    return { finishKey: activePack.defaultFloorFinishKey, colorIndex: activePack.defaultFloorColorIndex ?? 0 }
  }
  const group = finishesByGroup[roomDef.groupName]
  if (!group || group.length === 0) return { finishKey: null, colorIndex: 0 }
  return { finishKey: group[0].key, colorIndex: 0 }
}

export function defaultFurnitureFor(typeKey, furnitureByType) {
  const list = furnitureByType[typeKey]
  return list && list.length > 0 ? list[0].id : null
}
