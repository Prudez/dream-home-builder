import { useDraggable } from '@dnd-kit/core'
import { T } from '../lib/theme.js'
import { fmtKES } from '../lib/cost.js'
import RoomArt from './RoomArt.jsx'

export default function RoomBlock({ room, roomDef, finish, colorIndex, furnitureTierIndex, cell, selected, isDragging, onSelect, onResizeStart, onRotateStart, cost }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `room-${room.id}`,
    data: { kind: 'room', roomId: room.id, w: room.w, h: room.h, rotation: room.rotation ?? 0 },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(room.id)
      }}
      style={{
        position: 'absolute',
        left: room.x * cell,
        top: room.y * cell,
        width: room.w * cell - 3,
        height: room.h * cell - 3,
        margin: 1.5,
        borderRadius: roomDef.groupName === 'garden' ? 14 : 6,
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        opacity: isDragging ? 0.35 : 1,
        boxShadow: selected
          ? `0 0 0 2.5px ${T.gold}, 0 4px 10px rgba(10,30,60,0.2)`
          : '0 2px 6px rgba(10,30,60,0.12)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <RoomArt room={room} roomDef={roomDef} cell={cell} finish={finish} colorIndex={colorIndex} furnitureTierIndex={furnitureTierIndex} />
      <span
        style={{
          display: 'inline-block',
          maxWidth: room.w * cell - 3,
          background: 'rgba(10,30,60,0.75)',
          color: '#FFF',
          fontSize: Math.max(8, cell * 0.19),
          fontWeight: 700,
          padding: '1.5px 6px',
          borderRadius: 4,
          marginBottom: 3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          boxSizing: 'border-box',
          pointerEvents: 'none',
        }}
      >
        {roomDef.icon} {roomDef.name} · {room.w * 2}×{room.h * 2}m · {fmtKES(cost)}
      </span>
      {selected && (
        <>
          <div
            onPointerDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onResizeStart(e, room.id)
            }}
            style={{
              position: 'absolute',
              right: -8,
              bottom: -8,
              width: 28,
              height: 28,
              background: T.gold,
              border: `2px solid ${T.white}`,
              borderRadius: 7,
              cursor: 'nwse-resize',
              touchAction: 'none',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
          />
          {/* Rotate handle — deliberately outside RoomArt's <g> rotation
              transform (see RoomArt.jsx), so it stays fixed at the room's
              unrotated top-center regardless of the room's current angle.
              Dragging it sets rotation directly from the cursor's angle
              around the room's center; see handleRotateStart in
              PlotCanvas.jsx. */}
          <div
            onPointerDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onRotateStart(e, room.id)
            }}
            title="Drag to rotate"
            style={{
              position: 'absolute',
              top: -28,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 26,
              height: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: T.navy,
              color: T.white,
              fontSize: 14,
              lineHeight: 1,
              border: `2px solid ${T.white}`,
              borderRadius: '50%',
              cursor: 'grab',
              touchAction: 'none',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
          >
            ⟳
          </div>
        </>
      )}
    </div>
  )
}
