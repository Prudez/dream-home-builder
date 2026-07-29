import { useState } from 'react'
import { T } from '../lib/theme.js'
import { fmtKES } from '../lib/cost.js'

const cardStyle = (active) => ({
  background: T.white,
  border: `2px solid ${active ? T.gold : T.border}`,
  borderRadius: 10,
  padding: '16px 16px 14px',
  cursor: 'pointer',
  flex: '1 1 150px',
  minWidth: 150,
  boxShadow: active ? '0 4px 14px rgba(201,161,74,0.25)' : '0 1px 3px rgba(10,30,60,0.06)',
})

export default function ShellStage({ shells, stylePacks, onStart }) {
  const [shellKey, setShellKey] = useState(null)
  const [packKey, setPackKey] = useState(null)
  const [starting, setStarting] = useState(false)

  const canStart = shellKey && packKey && !starting

  return (
    <div style={{ background: T.paper, minHeight: '100vh' }}>
      <div style={{ background: T.navy, color: T.white, padding: '22px 24px 20px' }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.22em',
            color: T.gold,
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          Blue Falcon Real Estate · Step 1 of 3
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(22px,4vw,34px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Shape Your House
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: '#B9C4D4', maxWidth: 540 }}>
          Big decisions first — how tall, and in what style?
        </p>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <p
          style={{
            fontSize: 12,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontWeight: 800,
            color: T.navy,
          }}
        >
          How many floors?
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {shells.map((s) => (
            <div key={s.key} style={cardStyle(shellKey === s.key)} onClick={() => setShellKey(s.key)}>
              <div style={{ fontSize: 26, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: 14, color: T.navy }}>
                {s.name}
              </div>
              <div style={{ fontSize: 12, color: '#5A6472', margin: '4px 0 8px' }}>{s.description}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.goldDeep }}>
                shell from {fmtKES(Number(s.shellCost))}
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: 12,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontWeight: 800,
            color: T.navy,
            marginTop: 28,
          }}
        >
          Pick your style
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {stylePacks.map((p) => (
            <div key={p.key} style={cardStyle(packKey === p.key)} onClick={() => setPackKey(p.key)}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {p.swatch.map((c, i) => (
                  <div key={i} style={{ width: 22, height: 22, borderRadius: 5, background: c }} />
                ))}
              </div>
              <div style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: 13, color: T.navy }}>
                {p.name}
              </div>
              <div style={{ fontSize: 12, color: '#5A6472', marginTop: 4 }}>{p.tagline}</div>
            </div>
          ))}
        </div>

        <button
          type="button"
          disabled={!canStart}
          style={{
            marginTop: 28,
            background: T.gold,
            color: T.ink,
            border: 'none',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontSize: 12,
            padding: '12px 20px',
            borderRadius: 6,
            cursor: canStart ? 'pointer' : 'not-allowed',
            opacity: canStart ? 1 : 0.4,
          }}
          onClick={async () => {
            if (!canStart) return
            setStarting(true)
            const shell = shells.find((s) => s.key === shellKey)
            await onStart({ shellKey, floors: shell.floors, stylePack: packKey })
          }}
        >
          {starting ? 'Starting…' : 'Start building →'}
        </button>
      </div>
    </div>
  )
}
