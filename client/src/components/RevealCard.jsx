import { useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { isKenyanPhone } from '../../../shared/contract.js'
import { createLead } from '../lib/api.js'
import { T } from '../lib/theme.js'
import { fmtKES, resolveFinish } from '../lib/cost.js'
import { COLS, ROWS } from '../lib/grid.js'
import RoomArt from './RoomArt.jsx'

const MINI_CELL = 9

export default function RevealCard({ catalog, shell, design, matches, sessionId, logEvent, onClose }) {
  const [whatsapp, setWhatsapp] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [leadError, setLeadError] = useState(null)
  const [sharing, setSharing] = useState(false)
  const cardRef = useRef(null)

  const roomsByKey = useMemo(() => Object.fromEntries(catalog.rooms.map((r) => [r.key, r])), [catalog.rooms])
  const stylePacksByKey = useMemo(
    () => Object.fromEntries(catalog.stylePacks.map((p) => [p.key, p])),
    [catalog.stylePacks]
  )
  const furnitureByType = useMemo(() => {
    const map = {}
    for (const f of catalog.furniture) {
      if (!map[f.roomType]) map[f.roomType] = []
      map[f.roomType].push(f)
    }
    return map
  }, [catalog.furniture])
  const finishesByGroupKey = useMemo(() => {
    const byGroup = {}
    for (const f of catalog.finishes) {
      if (!byGroup[f.groupName]) byGroup[f.groupName] = []
      byGroup[f.groupName].push(f)
    }
    const map = {}
    for (const [group, list] of Object.entries(byGroup)) {
      map[group] = Object.fromEntries(list.map((f) => [f.key, f]))
    }
    return map
  }, [catalog.finishes])

  const snapshot = design.snapshot
  const groundFloorRooms = snapshot.rooms.filter((r) => r.floor === 0)
  const stylePackName = stylePacksByKey[snapshot.stylePack]?.name ?? snapshot.stylePack

  const isValidPhone = isKenyanPhone(whatsapp)

  async function handleSendWhatsapp() {
    if (!isValidPhone) return
    setSending(true)
    setLeadError(null)
    try {
      await createLead({ sessionId, designId: design.id, whatsapp })
      setSent(true)
      logEvent('lead_submitted', { designId: design.id })
    } catch (err) {
      setLeadError({ code: err.code, message: err.message })
    } finally {
      setSending(false)
    }
  }

  async function handleShare() {
    if (!cardRef.current) return
    setSharing(true)
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: T.white, scale: 2 })
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'dream-home.png'
        a.click()
        URL.revokeObjectURL(url)
      })
    } finally {
      setSharing(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,30,60,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 20,
        overflowY: 'auto',
      }}
    >
      <div
        ref={cardRef}
        style={{ background: T.white, borderRadius: 12, maxWidth: 440, width: '100%', overflow: 'hidden' }}
      >
        <div style={{ background: T.navy, color: T.white, padding: '22px 24px' }}>
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
            Step 3 of 3 · Your dream home profile
          </div>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, textTransform: 'uppercase' }}>
            {design.profileLabel}
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#B9C4D4' }}>
            {snapshot.floors} floor{snapshot.floors !== 1 ? 's' : ''} · {stylePackName} · {snapshot.rooms.length}{' '}
            rooms · {fmtKES(Number(design.total))}
          </p>
        </div>

        <div style={{ padding: '18px 24px 22px' }}>
          <div
            style={{
              position: 'relative',
              width: COLS * MINI_CELL,
              height: ROWS * MINI_CELL,
              maxWidth: '100%',
              margin: '0 auto 18px',
              background: T.paper,
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              overflow: 'hidden',
            }}
          >
            {groundFloorRooms.map((r, i) => {
              const roomDef = roomsByKey[r.type]
              if (!roomDef) return null
              const finish = resolveFinish(r, roomDef, finishesByGroupKey)
              const furnList = furnitureByType[r.type] ?? []
              const furnitureTierIndex = Math.max(0, furnList.findIndex((f) => f.id === r.furnitureId))
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: r.x * MINI_CELL,
                    top: r.y * MINI_CELL,
                    width: r.w * MINI_CELL - 1,
                    height: r.h * MINI_CELL - 1,
                    borderRadius: roomDef.groupName === 'garden' ? 6 : 3,
                    overflow: 'hidden',
                  }}
                >
                  <RoomArt
                    room={r}
                    roomDef={roomDef}
                    cell={MINI_CELL}
                    finish={finish}
                    colorIndex={r.colorIndex ?? 0}
                    furnitureTierIndex={furnitureTierIndex}
                  />
                </div>
              )
            })}
          </div>

          <p
            style={{
              fontSize: 12,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 800,
              color: T.goldDeep,
              margin: '0 0 10px',
            }}
          >
            Properties that match your build
          </p>
          {matches.map((listing) => (
            <div
              key={listing.id}
              style={{
                fontSize: 13.5,
                color: T.navy,
                fontWeight: 600,
                padding: '8px 0',
                borderBottom: `1px solid ${T.border}`,
              }}
            >
              {listing.name}, {listing.location} — {listing.tagline}
            </div>
          ))}

          {sent ? (
            <p style={{ fontSize: 13, color: T.green, fontWeight: 700, marginTop: 16 }}>
              Thanks — we'll WhatsApp you your matches shortly.
            </p>
          ) : (
            <>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <input
                  placeholder="WhatsApp number for your matches"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  style={{
                    flex: 1,
                    border: `1.5px solid ${T.border}`,
                    borderRadius: 6,
                    padding: '10px 12px',
                    fontSize: 13,
                  }}
                />
                <button
                  type="button"
                  disabled={!isValidPhone || sending}
                  onClick={handleSendWhatsapp}
                  style={{
                    background: T.gold,
                    color: T.ink,
                    border: 'none',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontSize: 12,
                    padding: '12px 20px',
                    borderRadius: 6,
                    cursor: !isValidPhone || sending ? 'not-allowed' : 'pointer',
                    opacity: !isValidPhone || sending ? 0.4 : 1,
                  }}
                >
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
              {whatsapp.length > 0 && !isValidPhone && (
                <p style={{ fontSize: 10.5, color: T.danger, marginTop: 6 }}>
                  Enter a valid Kenyan number, e.g. 0712 345 678 or +254712345678.
                </p>
              )}
              {leadError && (
                <pre style={{ color: T.danger, fontSize: 10.5, marginTop: 6, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(leadError, null, 2)}
                </pre>
              )}
            </>
          )}

          <button
            type="button"
            disabled={sharing}
            onClick={handleShare}
            style={{
              width: '100%',
              marginTop: 12,
              background: 'transparent',
              color: T.navy,
              border: `1px solid ${T.border}`,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: 12,
              padding: '11px 14px',
              borderRadius: 6,
              cursor: sharing ? 'not-allowed' : 'pointer',
            }}
          >
            {sharing ? 'Preparing image…' : 'Share as image'}
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              marginTop: 10,
              background: 'transparent',
              color: T.navy,
              border: `1px solid ${T.border}`,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: 12,
              padding: '11px 14px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            ← Keep building
          </button>
        </div>
      </div>
    </div>
  )
}
