import { useEffect, useState } from 'react'
import { getSalesLeads } from './lib/api.js'
import { T } from './lib/theme.js'
import { fmtKES } from './lib/cost.js'

function scoreColor(score) {
  if (score >= 70) return T.gold
  if (score >= 40) return T.navyMid
  return T.slate
}

function ScoreBadge({ score }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 44,
        height: 44,
        borderRadius: 8,
        background: scoreColor(score),
        color: T.white,
        fontWeight: 900,
        fontSize: 16,
      }}
    >
      {score}
    </div>
  )
}

function LeadCard({ lead }) {
  return (
    <div
      style={{
        background: T.white,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: '16px 18px',
        marginBottom: 14,
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
      }}
    >
      <ScoreBadge score={lead.leadScore ?? 0} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: T.navy, textTransform: 'uppercase' }}>
              {lead.profileLabel ?? 'Unfinished design'}
            </div>
            <div style={{ fontSize: 12, color: T.slate }}>
              {new Date(lead.createdAt).toLocaleString()} · {lead.whatsapp}
              {lead.stylePack ? ` · ${lead.stylePack}` : ''}
            </div>
          </div>
          {lead.total != null && (
            <div style={{ fontWeight: 800, fontSize: 15, color: T.goldDeep }}>{fmtKES(Number(lead.total))}</div>
          )}
        </div>

        {lead.signals?.length > 0 && (
          <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none' }}>
            {lead.signals.map((s) => (
              <li key={s.key} style={{ fontSize: 13, color: T.navy, padding: '4px 0', borderTop: `1px solid ${T.border}` }}>
                <span style={{ fontWeight: 700 }}>{s.label}:</span> {s.value}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function SalesPage() {
  const [leads, setLeads] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getSalesLeads()
      .then((data) => setLeads(data.leads))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div style={{ background: T.paper, minHeight: '100vh' }}>
      <div style={{ background: T.navy, color: T.white, padding: '18px 24px' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.22em', color: T.gold, textTransform: 'uppercase', fontWeight: 700 }}>
          Blue Falcon Real Estate · Internal
        </div>
        <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, textTransform: 'uppercase' }}>Scored leads</h1>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
        {error && <div style={{ color: T.danger, fontSize: 13 }}>Failed to load leads: {error}</div>}
        {!error && !leads && <div style={{ color: T.slate, fontSize: 13 }}>Loading…</div>}
        {leads && leads.length === 0 && <div style={{ color: T.slate, fontSize: 13 }}>No leads yet.</div>}
        {leads?.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  )
}
