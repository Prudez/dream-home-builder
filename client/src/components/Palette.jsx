import { useDraggable } from '@dnd-kit/core'
import { T } from '../lib/theme.js'
import { fmtKES } from '../lib/cost.js'

function PaletteChip({ room, disabled }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `palette-${room.key}`,
    data: { kind: 'palette', typeKey: room.key, w: room.defaultW, h: room.defaultH },
    disabled,
  })

  return (
    <div
      ref={setNodeRef}
      {...(disabled ? {} : listeners)}
      {...attributes}
      title={disabled ? 'Ground floor only' : ''}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: T.white,
        border: `1.5px solid ${T.border}`,
        borderRadius: 8,
        padding: '8px 12px',
        marginBottom: 7,
        cursor: disabled ? 'not-allowed' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <span style={{ fontSize: 15 }}>{room.icon}</span>
      <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: T.navy }}>{room.name}</span>
      <span style={{ fontSize: 10.5, color: T.slate }}>{fmtKES(Number(room.perCellPrice))}/sq</span>
    </div>
  )
}

export default function Palette({ rooms, floor }) {
  return (
    <div style={{ flex: '1 1 225px', minWidth: 225 }}>
      <p
        style={{
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontWeight: 800,
          color: T.navy,
          margin: '0 0 10px',
        }}
      >
        Drag onto the plot
      </p>
      {rooms.map((room) => (
        <PaletteChip key={room.key} room={room} disabled={room.groundOnly && floor !== 0} />
      ))}
    </div>
  )
}
