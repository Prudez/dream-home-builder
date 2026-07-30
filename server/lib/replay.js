import { indexBy, groupBy, totalCost } from '../../shared/cost.js';
import { defaultFinishFor, defaultFurnitureFor } from '../../shared/catalogDefaults.js';

// Reconstructs a session's history from its event log. Event payloads only
// ever carry the *new* value of whatever changed (see PlotCanvas.jsx's
// logEvent calls) — never the old one — so counters like "did this resize
// grow or shrink the room" can't be read off a single event payload the way
// the prototype read them off live React state. This walks events in
// chronological order, keeping the same per-room state the client keeps
// live, and diffs against that reconstructed state instead.
//
// Older events logged before `room_added` carried its own `roomId` (see
// migration/contract history) are handled by falling back to sequential
// inference: room ids are assigned by a monotonically increasing counter
// client-side (PlotCanvas.jsx's `nextIdRef`) that only ever increments on
// placement, so the Nth room_added event chronologically is safely room id
// N when the payload itself doesn't say so.
export function replaySession(events, catalog, fallback = {}) {
  const roomsByKey = indexBy(catalog.rooms, 'key');
  const shellsByKey = indexBy(catalog.shells, 'key');
  const stylePacksByKey = indexBy(catalog.stylePacks, 'key');
  const furnitureById = indexBy(catalog.furniture, 'id');
  const furnitureByType = groupBy(catalog.furniture, 'roomType');
  const finishesByGroup = groupBy(catalog.finishes, 'groupName');
  const finishesByGroupKey = Object.fromEntries(
    Object.entries(finishesByGroup).map(([group, entries]) => [group, indexBy(entries, 'key')])
  );

  const rooms = new Map();
  let nextRoomId = 1;
  let shellKey = fallback.shellKey ?? null;
  let stylePack = fallback.stylePack ?? null;
  let peakCost = 0;
  let removals = 0;
  let grows = 0;
  let shrinks = 0;
  let upgrades = 0;
  let financing = null;

  function currentTotal() {
    if (!shellKey) return 0;
    return totalCost(Array.from(rooms.values()), roomsByKey, finishesByGroupKey, furnitureById, shellsByKey, shellKey);
  }

  function finishMultOf(room) {
    const roomDef = roomsByKey[room.type];
    if (!roomDef?.groupName) return 1;
    const group = finishesByGroupKey[roomDef.groupName];
    const key = room.finishKey ?? Object.keys(group ?? {})[0];
    const finish = group?.[key];
    return finish ? Number(finish.mult) : 1;
  }

  function furnitureCostOf(room) {
    if (room.furnitureId == null) return 0;
    const f = furnitureById[room.furnitureId];
    return f ? Number(f.cost) : 0;
  }

  function markPeak() {
    peakCost = Math.max(peakCost, currentTotal());
  }

  for (const event of events) {
    const { eventType, payload } = event;
    switch (eventType) {
      case 'shell_chosen': {
        shellKey = payload?.shellKey ?? shellKey;
        stylePack = payload?.stylePack ?? stylePack;
        break;
      }
      case 'room_added': {
        const roomId = payload?.roomId ?? nextRoomId;
        nextRoomId = Math.max(nextRoomId, roomId + 1);
        const roomDef = roomsByKey[payload?.type];
        const activePack = stylePacksByKey[stylePack];
        const { finishKey, colorIndex } = roomDef
          ? defaultFinishFor(roomDef, activePack, finishesByGroup)
          : { finishKey: null, colorIndex: 0 };
        const furnitureId = defaultFurnitureFor(payload?.type, furnitureByType);
        rooms.set(roomId, {
          type: payload?.type,
          w: Number(payload?.w) || 0,
          h: Number(payload?.h) || 0,
          finishKey,
          colorIndex,
          furnitureId,
        });
        markPeak();
        break;
      }
      case 'room_resized': {
        const room = rooms.get(payload?.roomId);
        if (!room) break;
        const oldArea = room.w * room.h;
        const newW = Number(payload?.w) || room.w;
        const newH = Number(payload?.h) || room.h;
        const newArea = newW * newH;
        if (newArea > oldArea) grows += 1;
        else if (newArea < oldArea) shrinks += 1;
        room.w = newW;
        room.h = newH;
        markPeak();
        break;
      }
      case 'room_removed': {
        if (rooms.delete(payload?.roomId)) removals += 1;
        markPeak();
        break;
      }
      case 'finish_changed': {
        const room = rooms.get(payload?.roomId);
        if (!room) break;
        const oldMult = finishMultOf(room);
        room.finishKey = payload?.finishKey ?? null;
        room.colorIndex = 0;
        if (finishMultOf(room) > oldMult) upgrades += 1;
        markPeak();
        break;
      }
      case 'colour_changed': {
        const room = rooms.get(payload?.roomId);
        if (!room) break;
        room.colorIndex = Number(payload?.colorIndex) || 0;
        break;
      }
      case 'furniture_changed': {
        const room = rooms.get(payload?.roomId);
        if (!room) break;
        const oldCost = furnitureCostOf(room);
        room.furnitureId = payload?.furnitureId ?? null;
        if (furnitureCostOf(room) > oldCost) upgrades += 1;
        markPeak();
        break;
      }
      case 'financing_answered': {
        financing = payload?.answer ?? financing;
        break;
      }
      default:
        break;
    }
  }

  return { peakCost, removals, grows, shrinks, upgrades, financing };
}
