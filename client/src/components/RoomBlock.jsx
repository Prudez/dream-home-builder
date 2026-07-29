import { useDraggable } from '@dnd-kit/core'
import { T } from '../lib/theme.js'
import { fmtKES } from '../lib/cost.js'

export default function RoomBlock({ room, roomDef, cell, selected, isDragging, onSelect, onResizeStart, cost }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `room-${room.id}`,
    data: { kind: 'room', roomId: room.id, w: room.w, h: room.h },
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
        borderRadius: 6,
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        opacity: isDragging ? 0.35 : 1,
        background: T.white,
        border: `1.5px solid ${T.border}`,
        boxShadow: selected
          ? `0 0 0 2.5px ${T.gold}, 0 4px 10px rgba(10,30,60,0.2)`
          : '0 2px 6px rgba(10,30,60,0.12)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          background: 'rgba(10,30,60,0.75)',
          color: '#FFF',
          fontSize: Math.max(8, cell * 0.19),
          fontWeight: 700,
          padding: '1.5px 6px',
          borderRadius: 4,
          marginBottom: 3,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        {roomDef.icon} {roomDef.name} · {room.w * 2}×{room.h * 2}m · {fmtKES(cost)}
      </span>
      {selected && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onResizeStart(e, room.id)
          }}
          style={{
            position: 'absolute',
            right: -7,
            bottom: -7,
            width: 18,
            height: 18,
            background: T.gold,
            border: `2px solid ${T.white}`,
            borderRadius: 5,
            cursor: 'nwse-resize',
            touchAction: 'none',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        />
      )}
    </div>
  )
}
