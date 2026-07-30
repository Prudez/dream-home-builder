import { useEffect, useRef, useState } from 'react'
import { T } from '../lib/theme.js'
import { fmtKES } from '../lib/cost.js'

function TexturePreview({ texture, hex }) {
  const base = { position: 'absolute', inset: 0, borderRadius: 5, background: hex, overflow: 'hidden' }
  let overlay = null
  if (texture === 'plank') {
    overlay = [...Array(4)].map((_, i) => (
      <div key={i} style={{ position: 'absolute', top: i * 9, left: 0, right: 0, height: 1, background: 'rgba(0,0,0,0.15)' }} />
    ))
  } else if (texture === 'tile') {
    overlay = (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '11px 11px',
        }}
      />
    )
  } else if (texture === 'gloss') {
    overlay = <div style={{ position: 'absolute', top: 0, left: 8, width: 16, height: 40, background: 'rgba(255,255,255,0.35)', transform: 'skewX(-20deg)' }} />
  } else if (texture === 'granite' || texture === 'carpet') {
    overlay = [...Array(10)].map((_, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          top: ((i * 13) % 30) + 2,
          left: ((i * 23) % 106) + 4,
          width: 2,
          height: 2,
          borderRadius: 2,
          background: i % 2 ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
        }}
      />
    ))
  } else if (texture === 'water') {
    overlay = <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.35), transparent 60%)' }} />
  } else if (texture === 'grass') {
    overlay = [...Array(8)].map((_, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          top: ((i * 11) % 28) + 3,
          left: ((i * 17) % 108) + 4,
          width: 1.5,
          height: 5,
          background: 'rgba(0,0,0,0.25)',
          borderRadius: 2,
          transform: 'rotate(8deg)',
        }}
      />
    ))
  }
  return (
    <div style={{ height: 34, borderRadius: 5, position: 'relative', overflow: 'hidden', marginBottom: 6 }}>
      <div style={base} />
      {overlay}
    </div>
  )
}

export default function Picker({ room, roomDef, finishes, furniture, activeFinish, colorIndex, onSelectFinish, onSelectColor, onSelectFurniture }) {
  const hasFinishes = finishes.length > 0
  const hasFurniture = furniture.length > 0
  const [tab, setTab] = useState(hasFinishes ? 'finish' : 'furniture')
  const pickerRef = useRef(null)

  useEffect(() => {
    if (!hasFinishes) setTab('furniture')
  }, [room.id, hasFinishes])

  useEffect(() => {
    const t = setTimeout(() => pickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120)
    return () => clearTimeout(t)
  }, [room.id])

  if (!hasFinishes && !hasFurniture) return null

  return (
    <div ref={pickerRef} style={{ marginTop: 12, background: T.white, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 800, color: T.navy }}>{roomDef.name}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {hasFinishes && (
            <button type="button" onClick={() => setTab('finish')} style={tabButtonStyle(tab === 'finish')}>
              Finishes
            </button>
          )}
          {hasFurniture && (
            <button type="button" onClick={() => setTab('furniture')} style={tabButtonStyle(tab === 'furniture')}>
              Furniture
            </button>
          )}
        </div>
      </div>

      {tab === 'furniture' && hasFurniture && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {furniture.map((f) => {
            const active = room.furnitureId === f.id
            return (
              <div key={f.id} onClick={() => onSelectFurniture(f.id)} style={cardStyle(active)}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: T.navy, lineHeight: 1.2 }}>{f.name}</div>
                <div style={{ fontSize: 10.5, color: '#5A6472', margin: '3px 0 6px', lineHeight: 1.3 }}>{f.description}</div>
                <div style={{ fontSize: 10.5, color: Number(f.cost) > 0 ? T.goldDeep : T.slate, fontWeight: 700 }}>
                  {Number(f.cost) > 0 ? `+${fmtKES(Number(f.cost))}` : 'included'}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'finish' && hasFinishes && (
        <>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {finishes.map((f) => {
              const active = activeFinish?.key === f.key
              return (
                <div key={f.key} onClick={() => onSelectFinish(f.key)} style={{ ...cardStyle(active), width: 118, padding: 8 }}>
                  <TexturePreview texture={f.texture} hex={f.colors[0].hex} />
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.navy, lineHeight: 1.2 }}>{f.name}</div>
                  <div style={{ fontSize: 10.5, color: Number(f.mult) > 1 ? T.goldDeep : T.slate, fontWeight: 700, marginTop: 2 }}>
                    {Number(f.mult) > 1 ? `+${Math.round((Number(f.mult) - 1) * 100)}%` : 'standard'}
                  </div>
                </div>
              )
            })}
          </div>

          {activeFinish && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 800, color: T.slate }}>Colour</span>
              {activeFinish.colors.map((c, ci) => (
                <div
                  key={c.hex}
                  onClick={() => onSelectColor(ci)}
                  title={c.name}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: c.hex,
                    cursor: 'pointer',
                    border: `2.5px solid ${colorIndex === ci ? T.gold : T.border}`,
                    boxShadow: colorIndex === ci ? '0 2px 6px rgba(201,161,74,0.4)' : 'none',
                    boxSizing: 'border-box',
                  }}
                />
              ))}
              <span style={{ fontSize: 11, color: T.navy, fontWeight: 600, marginLeft: 4 }}>{activeFinish.colors[colorIndex]?.name}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function tabButtonStyle(active) {
  return {
    background: active ? T.navy : 'transparent',
    color: active ? T.white : T.navy,
    border: `1.5px solid ${active ? T.navy : T.border}`,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '6px 14px',
    minHeight: 44,
    cursor: 'pointer',
  }
}

function cardStyle(active) {
  return {
    flex: '0 0 auto',
    width: 128,
    border: `2px solid ${active ? T.gold : '#E4E8EE'}`,
    borderRadius: 8,
    padding: 10,
    cursor: 'pointer',
    background: active ? '#FDF9F0' : T.white,
  }
}
