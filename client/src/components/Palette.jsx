import { useDraggable } from '@dnd-kit/core'
import { T } from '../lib/theme.js'
import { fmtKES } from '../lib/cost.js'
import { useIsMobile } from '../hooks/useIsMobile.js'

function PaletteChip({ room, disabled, isMobile }) {
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
        minHeight: 44,
        background: T.white,
        border: `1.5px solid ${T.border}`,
        borderRadius: 8,
        padding: '10px 12px',
        marginBottom: isMobile ? 0 : 7,
        flexShrink: isMobile ? 0 : undefined,
        width: isMobile ? 168 : undefined,
        cursor: disabled ? 'not-allowed' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        opacity: disabled ? 0.35 : 1,
        boxSizing: 'border-box',
      }}
    >
      <span style={{ fontSize: 15 }}>{room.icon}</span>
      <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: T.navy }}>{room.name}</span>
      <span style={{ fontSize: 10.5, color: T.slate }}>{fmtKES(Number(room.perCellPrice))}/sq</span>
    </div>
  )
}

export default function Palette({ rooms, floor }) {
  const isMobile = useIsMobile()

  return (
    <div style={{ flex: isMobile ? '1 1 100%' : '1 1 225px', minWidth: isMobile ? '100%' : 225 }}>
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
      <div
        style={
          isMobile
            ? { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }
            : undefined
        }
      >
        {rooms.map((room) => (
          <PaletteChip key={room.key} room={room} disabled={room.groundOnly && floor !== 0} isMobile={isMobile} />
        ))}
      </div>
    </div>
  )
}
