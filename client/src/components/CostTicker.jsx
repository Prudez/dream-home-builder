import { useEffect, useRef, useState } from 'react'
import { T } from '../lib/theme.js'
import { fmtKES } from '../lib/cost.js'

export default function CostTicker({ total, roomCount, shellCostValue, premiumThreshold }) {
  const [displayCost, setDisplayCost] = useState(total)
  const rafRef = useRef(null)

  useEffect(() => {
    const step = () => {
      setDisplayCost((d) => {
        const diff = total - d
        if (Math.abs(diff) < 5000) return total
        rafRef.current = requestAnimationFrame(step)
        return d + diff * 0.15
      })
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [total])

  const premium = premiumThreshold != null && total >= premiumThreshold

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: T.ink,
        color: T.white,
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        padding: '10px 24px',
        borderBottom: `3px solid ${premium ? T.gold : T.navyMid}`,
      }}
    >
      <div>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.slate }}>
          Estimated build cost
        </div>
        <div
          style={{
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 900,
            fontSize: 'clamp(20px,4vw,30px)',
            color: premium ? T.gold : T.white,
          }}
        >
          {fmtKES(Math.round(displayCost))}
        </div>
      </div>
      <div style={{ textAlign: 'right', fontSize: 11, color: T.slate }}>
        <div>
          {roomCount} room{roomCount !== 1 ? 's' : ''} · shell {fmtKES(shellCostValue)}
        </div>
        <div style={{ color: premium ? T.gold : T.slate, fontWeight: premium ? 800 : 400 }}>
          {premium ? '★ Premium build' : 'no wrong answers'}
        </div>
      </div>
    </div>
  )
}
