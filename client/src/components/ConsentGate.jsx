import { useState } from 'react'
import { T } from '../lib/theme.js'

export default function ConsentGate({ onStart, error }) {
  const [consent, setConsent] = useState(false)
  const [starting, setStarting] = useState(false)

  const canStart = consent && !starting

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
          Blue Falcon Real Estate
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
          Design Your Dream Home
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: '#B9C4D4', maxWidth: 540 }}>
          Design your dream home in five minutes, then see Blue Falcon listings that match.
        </p>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
        <div
          style={{
            background: T.white,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: '20px 20px 18px',
            boxShadow: '0 1px 3px rgba(10,30,60,0.06)',
          }}
        >
          <p style={{ fontSize: 13, color: T.navy, lineHeight: 1.5, margin: '0 0 16px' }}>
            We use your answers to recommend properties. Under Kenya's Data Protection Act, we
            only collect what you choose to share here, and only to match you with relevant Blue
            Falcon listings.
          </p>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>
              I consent to Blue Falcon using my answers to recommend properties.
            </span>
          </label>

          <button
            type="button"
            disabled={!canStart}
            style={{
              marginTop: 20,
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
              cursor: canStart ? 'pointer' : 'not-allowed',
              opacity: canStart ? 1 : 0.4,
            }}
            onClick={async () => {
              if (!canStart) return
              setStarting(true)
              try {
                await onStart()
              } finally {
                setStarting(false)
              }
            }}
          >
            {starting ? 'Starting…' : 'Start building →'}
          </button>

          {error && (
            <pre style={{ color: T.danger, fontSize: 11, marginTop: 12, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(error, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
