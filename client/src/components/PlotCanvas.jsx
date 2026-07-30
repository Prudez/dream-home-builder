import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  rectIntersection,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import { T } from '../lib/theme.js'
import { COLS, ROWS, computeCellSize, collides, clampToGrid } from '../lib/grid.js'
import { roomCost, shellCost, totalCost, resolveFinish } from '../lib/cost.js'
import { defaultFinishFor, defaultFurnitureFor } from '../../../shared/catalogDefaults.js'
import { createDesign } from '../lib/api.js'
import Palette from './Palette.jsx'
import RoomBlock from './RoomBlock.jsx'
import CostTicker from './CostTicker.jsx'
import Picker from './Picker.jsx'
import FinancingModal from './FinancingModal.jsx'

const FLOOR_NAMES = ['Ground floor', 'First floor', 'Second floor']

// Hoisted to a stable module-level reference. dnd-kit's useSensor/useSensors
// memoize on this object's identity; a fresh literal on every render breaks
// that memoization and tears down the active drag's listeners on the next
// re-render (which onDragMove itself triggers).
const ACTIVATION_CONSTRAINT = { distance: 6 }

// dnd-kit's own `event.over` depends on its internal droppable rect cache,
// which can go stale relative to actual layout (seen here after a page's
// layout settles post-mount). Both rects below are measured live on every
// call, so overlap computed directly from them is robust to that staleness.
function rectsOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

function computeTarget(event, canvasRect, cell, w, h) {
  if (!canvasRect) return { target: null, isOver: false }
  const rect = event.active.rect.current.translated
  if (!rect) return { target: null, isOver: false }
  const isOver = rectsOverlap(rect, canvasRect)
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const gx = Math.round((centerX - canvasRect.left) / cell - w / 2)
  const gy = Math.round((centerY - canvasRect.top) / cell - h / 2)
  return { target: clampToGrid(gx, gy, w, h), isOver }
}

export default function PlotCanvas({
  rooms,
  shells,
  shellKey,
  floorsCount,
  stylePacks,
  stylePackKey,
  finishes,
  furniture,
  logEvent,
  sessionId,
  onDesignFinished,
}) {
  const [placed, setPlaced] = useState([])
  const [floor, setFloor] = useState(0)
  const [selected, setSelected] = useState(null)
  const [cell, setCell] = useState(40)
  const [drag, setDrag] = useState(null)
  const [showFinancing, setShowFinancing] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [finishError, setFinishError] = useState(null)

  const canvasRef = useRef(null)
  const nextIdRef = useRef(1)
  const resizeRef = useRef(null)
  const financingAskedRef = useRef(false)

  const roomsByKey = useMemo(() => Object.fromEntries(rooms.map((r) => [r.key, r])), [rooms])
  const shellsByKey = useMemo(() => Object.fromEntries(shells.map((s) => [s.key, s])), [shells])
  const stylePacksByKey = useMemo(() => Object.fromEntries(stylePacks.map((p) => [p.key, p])), [stylePacks])
  const activePack = stylePacksByKey[stylePackKey]

  const finishesByGroup = useMemo(() => {
    const map = {}
    for (const f of finishes) {
      if (!map[f.groupName]) map[f.groupName] = []
      map[f.groupName].push(f)
    }
    return map
  }, [finishes])
  const finishesByGroupKey = useMemo(() => {
    const map = {}
    for (const [group, list] of Object.entries(finishesByGroup)) {
      map[group] = Object.fromEntries(list.map((f) => [f.key, f]))
    }
    return map
  }, [finishesByGroup])

  const furnitureByType = useMemo(() => {
    const map = {}
    for (const f of furniture) {
      if (!map[f.roomType]) map[f.roomType] = []
      map[f.roomType].push(f)
    }
    return map
  }, [furniture])
  const furnitureById = useMemo(() => Object.fromEntries(furniture.map((f) => [f.id, f])), [furniture])

  const { setNodeRef: setDroppableRef } = useDroppable({ id: 'plot' })
  // Stable identity across renders. A fresh callback-ref function every
  // render makes React call it with null then the node again on each
  // render, which repeatedly unmounts/remounts the droppable registration
  // mid-drag and breaks collision detection.
  const setCanvasRef = useCallback(
    (node) => {
      canvasRef.current = node
      setDroppableRef(node)
    },
    [setDroppableRef]
  )

  // PointerSensor covers modern browsers (mouse, touch, pen via one unified
  // event model). Mouse/TouchSensor are additional fallbacks for input
  // paths that only synthesize legacy mouse/touch events. KeyboardSensor
  // covers accessible drag: focus a draggable, Space to pick up, arrow
  // keys to move, Space to drop, Escape to cancel.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: ACTIVATION_CONSTRAINT }),
    useSensor(MouseSensor, { activationConstraint: ACTIVATION_CONSTRAINT }),
    useSensor(TouchSensor, { activationConstraint: ACTIVATION_CONSTRAINT }),
    useSensor(KeyboardSensor)
  )

  useEffect(() => {
    const measure = () => {
      if (canvasRef.current) {
        setCell(computeCellSize(canvasRef.current.parentElement.clientWidth))
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const visibleRooms = placed.filter((r) => r.floor === floor)
  const total = totalCost(placed, roomsByKey, finishesByGroupKey, furnitureById, shellsByKey, shellKey)
  const shellCostValue = shellCost(shellsByKey, shellKey)

  useEffect(() => {
    if (!activePack) return
    const threshold = Number(activePack.premiumThreshold)
    if (!financingAskedRef.current && total >= threshold) {
      financingAskedRef.current = true
      setShowFinancing(true)
      logEvent('premium_crossed', { total, threshold })
    }
  }, [total, activePack, logEvent])

  function handleDragStart(event) {
    const data = event.active.data.current
    setDrag({ kind: data.kind, typeKey: data.typeKey, roomId: data.roomId, w: data.w, h: data.h, gx: 0, gy: 0, over: false, valid: false })
  }

  function handleDragMove(event) {
    const data = event.active.data.current
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    const { target, isOver } = computeTarget(event, canvasRect, cell, data.w, data.h)
    const valid = Boolean(isOver && target && !collides(target.x, target.y, data.w, data.h, floor, data.roomId ?? null, placed))
    setDrag((d) => (d ? { ...d, gx: target?.x ?? d.gx, gy: target?.y ?? d.gy, over: isOver, valid } : d))
  }

  function handleDragEnd(event) {
    const data = event.active.data.current
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    const { target, isOver } = computeTarget(event, canvasRect, cell, data.w, data.h)
    const valid = Boolean(isOver && target && !collides(target.x, target.y, data.w, data.h, floor, data.roomId ?? null, placed))

    if (data.kind === 'palette') {
      if (isOver && valid) {
        const id = nextIdRef.current++
        const roomDef = roomsByKey[data.typeKey]
        const { finishKey, colorIndex } = defaultFinishFor(roomDef, activePack, finishesByGroup)
        const furnitureId = defaultFurnitureFor(data.typeKey, furnitureByType)
        setPlaced((p) => [...p, { id, type: data.typeKey, x: target.x, y: target.y, w: data.w, h: data.h, floor, finishKey, colorIndex, furnitureId }])
        setSelected(id)
        logEvent('room_added', { roomId: id, type: data.typeKey, w: data.w, h: data.h, floor })
      }
    } else if (data.kind === 'room') {
      if (isOver && valid) {
        setPlaced((p) => p.map((r) => (r.id === data.roomId ? { ...r, x: target.x, y: target.y } : r)))
        logEvent('room_moved', { roomId: data.roomId, x: target.x, y: target.y, floor })
      } else if (!isOver) {
        const removedType = placed.find((r) => r.id === data.roomId)?.type
        setPlaced((p) => p.filter((r) => r.id !== data.roomId))
        setSelected((s) => (s === data.roomId ? null : s))
        logEvent('room_removed', { roomId: data.roomId, type: removedType })
      }
    }

    setDrag(null)
  }

  function handleDragCancel() {
    setDrag(null)
  }

  function handleResizeStart(e, roomId) {
    const room = placed.find((r) => r.id === roomId)
    if (!room) return
    resizeRef.current = { roomId, startW: room.w, startH: room.h, startClientX: e.clientX, startClientY: e.clientY }
  }

  useEffect(() => {
    function onMove(e) {
      const r = resizeRef.current
      if (!r) return
      const room = placed.find((p) => p.id === r.roomId)
      if (!room) return
      const roomDef = roomsByKey[room.type]
      let w = r.startW + Math.round((e.clientX - r.startClientX) / cell)
      let h = r.startH + Math.round((e.clientY - r.startClientY) / cell)
      w = Math.max(roomDef.minW, Math.min(roomDef.maxW, Math.min(w, COLS - room.x)))
      h = Math.max(roomDef.minH, Math.min(roomDef.maxH, Math.min(h, ROWS - room.y)))
      if ((w !== room.w || h !== room.h) && !collides(room.x, room.y, w, h, room.floor, room.id, placed)) {
        setPlaced((p) => p.map((x) => (x.id === room.id ? { ...x, w, h } : x)))
      }
    }
    function onUp() {
      const r = resizeRef.current
      resizeRef.current = null
      if (!r) return
      const room = placed.find((p) => p.id === r.roomId)
      if (room && (room.w !== r.startW || room.h !== r.startH)) {
        logEvent('room_resized', { roomId: room.id, type: room.type, w: room.w, h: room.h })
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [placed, cell, roomsByKey, logEvent])

  function handleSelectFinish(finishKey) {
    const room = placed.find((r) => r.id === selected)
    if (!room) return
    setPlaced((p) => p.map((r) => (r.id === selected ? { ...r, finishKey, colorIndex: 0 } : r)))
    logEvent('finish_changed', { roomId: selected, type: room.type, finishKey })
  }

  function handleSelectColor(colorIndex) {
    const room = placed.find((r) => r.id === selected)
    if (!room) return
    setPlaced((p) => p.map((r) => (r.id === selected ? { ...r, colorIndex } : r)))
    logEvent('colour_changed', { roomId: selected, type: room.type, finishKey: room.finishKey, colorIndex })
  }

  function handleSelectFurniture(furnitureId) {
    const room = placed.find((r) => r.id === selected)
    if (!room) return
    setPlaced((p) => p.map((r) => (r.id === selected ? { ...r, furnitureId } : r)))
    logEvent('furniture_changed', { roomId: selected, type: room.type, furnitureId })
  }

  function handleFinancingAnswer(answer) {
    setShowFinancing(false)
    logEvent('financing_answered', { answer })
  }

  async function handleFinish() {
    logEvent('design_finished', { roomCount: placed.length, total })
    setFinishing(true)
    setFinishError(null)
    try {
      const roomsPayload = placed.map((r) => ({
        type: r.type,
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
        floor: r.floor,
        finishKey: r.finishKey ?? null,
        colorIndex: r.colorIndex ?? 0,
        furnitureId: r.furnitureId ?? null,
      }))
      const { design, matches } = await createDesign({
        sessionId,
        shellKey,
        stylePack: stylePackKey,
        floors: floorsCount,
        rooms: roomsPayload,
      })
      onDesignFinished(design, matches)
    } catch (err) {
      setFinishError({ code: err.code, message: err.message })
    } finally {
      setFinishing(false)
    }
  }

  const canvasBorderColor = drag ? (drag.valid ? T.green : drag.over ? T.danger : '#D5DBE4') : '#D5DBE4'
  const selectedRoom = placed.find((r) => r.id === selected) ?? null
  const selectedRoomDef = selectedRoom ? roomsByKey[selectedRoom.type] : null
  const selectedFinishes = selectedRoomDef ? finishesByGroup[selectedRoomDef.groupName] ?? [] : []
  const selectedFurniture = selectedRoom ? furnitureByType[selectedRoom.type] ?? [] : []
  const selectedActiveFinish = selectedRoom && selectedRoomDef ? resolveFinish(selectedRoom, selectedRoomDef, finishesByGroupKey) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div style={{ background: T.paper, minHeight: '100vh' }}>
        <CostTicker
          total={total}
          roomCount={placed.length}
          shellCostValue={shellCostValue}
          premiumThreshold={activePack ? Number(activePack.premiumThreshold) : null}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, padding: '18px 24px', maxWidth: 1140, margin: '0 auto' }}>
          <Palette rooms={rooms} floor={floor} />

          <div style={{ flex: '3 1 450px', minWidth: 300 }}>
            {floorsCount > 1 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {Array.from({ length: floorsCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setFloor(i)
                      setSelected(null)
                      logEvent('floor_viewed', { floor: i })
                    }}
                    style={{
                      background: floor === i ? T.gold : 'transparent',
                      color: floor === i ? T.ink : T.navy,
                      border: `1px solid ${floor === i ? T.gold : T.border}`,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontSize: 11,
                      padding: '8px 14px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    {FLOOR_NAMES[i] ?? `Floor ${i + 1}`}
                  </button>
                ))}
              </div>
            )}

            <div
              ref={setCanvasRef}
              onClick={() => setSelected(null)}
              style={{
                position: 'relative',
                width: COLS * cell,
                height: ROWS * cell,
                maxWidth: '100%',
                background: T.white,
                borderRadius: 10,
                border: `2px solid ${canvasBorderColor}`,
                backgroundImage:
                  'linear-gradient(to right, rgba(10,30,60,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,30,60,0.045) 1px, transparent 1px)',
                backgroundSize: `${cell}px ${cell}px`,
                boxShadow: '0 4px 16px rgba(10,30,60,0.08)',
                overflow: 'hidden',
              }}
            >
              {visibleRooms.length === 0 && !drag && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: T.slate,
                    fontSize: 13,
                    textAlign: 'center',
                    padding: 20,
                  }}
                >
                  {floor === 0 ? 'Your plot awaits — rooms, garden and pool go here.' : `${FLOOR_NAMES[floor] ?? 'This floor'} is empty.`}
                </div>
              )}

              {visibleRooms.map((r) => {
                const roomDef = roomsByKey[r.type]
                const finish = resolveFinish(r, roomDef, finishesByGroupKey)
                const colorIndex = r.colorIndex ?? 0
                const furnList = furnitureByType[r.type] ?? []
                const furnitureTierIndex = Math.max(0, furnList.findIndex((f) => f.id === r.furnitureId))
                return (
                  <RoomBlock
                    key={r.id}
                    room={r}
                    roomDef={roomDef}
                    finish={finish}
                    colorIndex={colorIndex}
                    furnitureTierIndex={furnitureTierIndex}
                    cell={cell}
                    selected={selected === r.id}
                    isDragging={drag?.kind === 'room' && drag.roomId === r.id}
                    onSelect={setSelected}
                    onResizeStart={handleResizeStart}
                    cost={roomCost(r, roomsByKey, finishesByGroupKey, furnitureById)}
                  />
                )
              })}

              {drag && drag.over && (
                <div
                  style={{
                    position: 'absolute',
                    left: drag.gx * cell,
                    top: drag.gy * cell,
                    width: drag.w * cell,
                    height: drag.h * cell,
                    background: drag.valid ? 'rgba(78,122,87,0.25)' : 'rgba(180,69,58,0.2)',
                    border: `2px dashed ${drag.valid ? T.green : T.danger}`,
                    borderRadius: 6,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
            <p style={{ fontSize: 11, color: T.slate, marginTop: 8 }}>
              Plot: {COLS * 2}m × {ROWS * 2}m · each square = 2m × 2m
            </p>

            <button
              type="button"
              disabled={placed.length === 0 || finishing}
              onClick={handleFinish}
              style={{
                marginTop: 4,
                width: '100%',
                background: T.gold,
                color: T.ink,
                border: 'none',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontSize: 12,
                padding: '12px 20px',
                borderRadius: 6,
                cursor: placed.length === 0 || finishing ? 'not-allowed' : 'pointer',
                opacity: placed.length === 0 || finishing ? 0.4 : 1,
              }}
            >
              {finishing ? 'Saving…' : 'Finish my design →'}
            </button>
            {finishError && (
              <pre style={{ color: T.danger, fontSize: 11, marginTop: 8, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(finishError, null, 2)}
              </pre>
            )}

            {selectedRoom && selectedRoomDef && (
              <Picker
                room={selectedRoom}
                roomDef={selectedRoomDef}
                finishes={selectedFinishes}
                furniture={selectedFurniture}
                activeFinish={selectedActiveFinish}
                colorIndex={selectedRoom.colorIndex ?? 0}
                onSelectFinish={handleSelectFinish}
                onSelectColor={handleSelectColor}
                onSelectFurniture={handleSelectFurniture}
              />
            )}
          </div>
        </div>
      </div>

      {showFinancing && activePack && <FinancingModal threshold={Number(activePack.premiumThreshold)} onAnswer={handleFinancingAnswer} />}
    </DndContext>
  )
}
