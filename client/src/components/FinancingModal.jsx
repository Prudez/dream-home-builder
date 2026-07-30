import { T } from '../lib/theme.js'
import { fmtKES } from '../lib/cost.js'

const OPTIONS = ['Mortgage / bank financing', 'Savings — cash buyer', 'Build in phases over time', 'Just dreaming for now']

export default function FinancingModal({ threshold, onAnswer }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,30,60,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 20,
      }}
    >
      <div style={{ background: T.white, borderRadius: 12, padding: '26px 26px 22px', maxWidth: 400, width: '100%' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.22em', color: T.goldDeep, textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
          Going premium ★
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 900, textTransform: 'uppercase', color: T.navy }}>
          This build just passed {fmtKES(threshold)}
        </h2>
        <p style={{ fontSize: 13, color: '#5A6472', margin: '0 0 16px' }}>
          Love the ambition. If you were building this for real, how would you fund it?
        </p>
        {OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              background: T.paper,
              border: `1.5px solid ${T.border}`,
              borderRadius: 8,
              padding: '11px 14px',
              fontSize: 13.5,
              fontWeight: 600,
              color: T.navy,
              marginBottom: 8,
              cursor: 'pointer',
            }}
            onClick={() => onAnswer(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
