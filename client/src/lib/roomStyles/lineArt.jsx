// Style: Line Art — bold navy outlines around every furniture shape and
// wall, material colour-coding so furniture type is legible by fill alone,
// dashed-outline rugs, and proportion rules that make seating read as wide
// and shallow while beds/loungers ("anything lain-on") read as narrow and
// long. Implements the same interface as ./softDepth.js — see ./index.js
// for the interface contract.

import { shade } from '../svgHelpers.js'

const OUTLINE = '#0A1E3C' // dark navy — every outline in this style
const SEATING = '#13315C' // soft seating / upholstery
const BEDDING = '#E3D5BE' // bedding surfaces (mattress, cushions, mats)
const BEDDING_LIGHT = '#F2EAD9'
const WOOD = '#8E5B33' // hard furniture: headboards, cabinet fronts, desks, shelves
const GOLD = '#C9A14A' // accent pieces: tables, lamp shades, pendant lights
const GOLD_DEEP = '#A97F2C'
const SOFT = '#EAF0F5' // sanitaryware (WC/tub/basin)
const GREEN = '#4E7A57' // planting

const SW = 1.75 // primary outline stroke width (spec: 1.5-2px)
const SW_SMALL = 1.25 // secondary/smaller-piece outline

// Rugs (Phase 10 spec): dashed-outline rounded rect, drawn beneath whatever
// sits on it — callers push this before the furniture piece it belongs to.
function rug(key, x, y, w, h, rx = 6) {
  return <rect key={key} x={x} y={y} width={w} height={h} rx={rx} fill="none" stroke={OUTLINE} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7} />
}

function drawFloor({ room, W, H, cell, finish, color, rand }) {
  const r = rand
  const els = []

  if (!finish) {
    els.push(<rect key="bg" width={W} height={H} fill={room.type === 'garage' ? '#C7CDD4' : '#DDE2E9'} stroke={OUTLINE} strokeWidth={1.5} />)
    if (room.type === 'garage') {
      els.push(<line key="g1" x1={W / 2} y1={6} x2={W / 2} y2={H - 6} stroke={OUTLINE} strokeWidth={2} strokeDasharray="8 6" opacity={0.6} />)
    }
    if (room.type === 'gate') {
      els.push(
        <g key="gt">
          {[...Array(6)].map((_, i) => (
            <rect key={i} x={4 + (i * (W - 8)) / 6} y={H * 0.25} width={3} height={H * 0.5} fill={OUTLINE} />
          ))}
        </g>
      )
    }
    if (room.type === 'borehole') {
      els.push(<circle key="bh" cx={W / 2} cy={H / 2} r={Math.min(W, H) * 0.28} fill="#4E75A8" stroke={OUTLINE} strokeWidth={SW} />)
    }
  } else {
    els.push(<rect key="bg" width={W} height={H} fill={color} stroke={OUTLINE} strokeWidth={1} />)
    if (finish.texture === 'tile') {
      const s = Math.max(12, cell / 2.4)
      for (let x = s; x < W; x += s) els.push(<line key={'tx' + x} x1={x} y1={0} x2={x} y2={H} stroke={OUTLINE} strokeWidth={0.75} opacity={0.22} />)
      for (let y = s; y < H; y += s) els.push(<line key={'ty' + y} x1={0} y1={y} x2={W} y2={y} stroke={OUTLINE} strokeWidth={0.75} opacity={0.22} />)
    } else if (finish.texture === 'plank') {
      const ph = Math.max(8, cell / 4)
      for (let y = 0; y < H; y += ph) {
        els.push(<line key={'pl' + y} x1={0} y1={y} x2={W} y2={y} stroke={OUTLINE} strokeWidth={0.75} opacity={0.3} />)
        const off = (Math.floor(y / ph) % 2) * W * 0.3 + W * 0.2
        els.push(<line key={'pj' + y} x1={off % W} y1={y} x2={off % W} y2={y + ph} stroke={OUTLINE} strokeWidth={0.75} opacity={0.22} />)
      }
    } else if (finish.texture === 'parquet') {
      const s = Math.max(10, cell / 3)
      for (let i = -H; i < W; i += s) {
        els.push(<line key={'d1' + i} x1={i} y1={0} x2={i + H} y2={H} stroke={OUTLINE} strokeWidth={0.75} opacity={0.22} />)
        els.push(<line key={'d2' + i} x1={i + H} y1={0} x2={i} y2={H} stroke={OUTLINE} strokeWidth={0.75} opacity={0.16} />)
      }
    } else if (finish.texture === 'gloss') {
      const s = Math.max(20, cell)
      for (let x = s; x < W; x += s) els.push(<line key={'gx' + x} x1={x} y1={0} x2={x} y2={H} stroke={OUTLINE} strokeWidth={0.6} opacity={0.12} />)
      for (let y = s; y < H; y += s) els.push(<line key={'gy' + y} x1={0} y1={y} x2={W} y2={y} stroke={OUTLINE} strokeWidth={0.6} opacity={0.12} />)
      els.push(<polygon key="sheen" points={`0,${H * 0.2} ${W * 0.35},0 ${W * 0.55},0 0,${H * 0.55}`} fill="rgba(255,255,255,0.3)" />)
    } else if (finish.texture === 'carpet') {
      for (let i = 0; i < (W * H) / 60; i++) els.push(<circle key={'c' + i} cx={r() * W} cy={r() * H} r={0.9} fill={OUTLINE} opacity={0.14} />)
    } else if (finish.texture === 'granite') {
      for (let i = 0; i < (W * H) / 40; i++) {
        els.push(<circle key={'gr' + i} cx={r() * W} cy={r() * H} r={0.8 + r() * 1.4} fill={r() > 0.5 ? 'rgba(255,255,255,0.28)' : OUTLINE} opacity={r() > 0.5 ? 1 : 0.2} />)
      }
    }
  }

  if (room.type === 'balcony') {
    const postGap = Math.max(9, cell / 3.4)
    els.push(<rect key="rail-edge" x={1} y={1} width={W - 2} height={H - 2} fill="none" stroke={OUTLINE} strokeWidth={2} rx={4} />)
    for (let x = postGap / 2; x < W; x += postGap) {
      els.push(<line key={'post' + x} x1={x} y1={1} x2={x} y2={6} stroke={OUTLINE} strokeWidth={1.5} />)
    }
  }

  return els
}

function drawPool({ W, H, finish, color, rand }) {
  const r = rand
  const coping = 7
  const els = []
  els.push(<rect key="deck" width={W} height={H} rx={10} fill={finish.key === 'deck' ? '#D9CFB8' : '#DAD5CB'} stroke={OUTLINE} strokeWidth={1.5} />)
  if (finish.key === 'deck') {
    for (let x = 0; x < W; x += 14) els.push(<line key={'dk' + x} x1={x} y1={0} x2={x} y2={H} stroke={OUTLINE} strokeWidth={0.5} opacity={0.15} />)
  }
  const infEdge = finish.key === 'infinity'
  els.push(
    <rect key="water" x={coping} y={coping} width={W - coping * 2} height={H - coping * (infEdge ? 1 : 2)} rx={8} fill={color} stroke={OUTLINE} strokeWidth={SW} />
  )
  if (infEdge) {
    els.push(<rect key="inf" x={coping} y={H - 10} width={W - coping * 2} height={8} fill={shade(color, 40)} opacity={0.6} rx={4} />)
  }
  for (let i = 0; i < 2; i++) {
    const cx = W * (0.3 + r() * 0.4)
    const cy = H * (0.25 + r() * 0.4)
    els.push(<ellipse key={'rp' + i} cx={cx} cy={cy} rx={W * 0.12} ry={W * 0.04} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.25} />)
  }
  els.push(
    <g key="lad" stroke={OUTLINE} strokeWidth={2} strokeLinecap="round">
      <line x1={W - coping - 14} y1={coping + 2} x2={W - coping - 14} y2={coping + 16} />
      <line x1={W - coping - 6} y1={coping + 2} x2={W - coping - 6} y2={coping + 16} />
      <line x1={W - coping - 14} y1={coping + 7} x2={W - coping - 6} y2={coping + 7} />
      <line x1={W - coping - 14} y1={coping + 13} x2={W - coping - 6} y2={coping + 13} />
    </g>
  )
  return els
}

function drawGarden({ W, H, finish, color, rand }) {
  const r = rand
  const els = []
  els.push(<rect key="bg" width={W} height={H} fill={color} stroke={OUTLINE} strokeWidth={1.5} rx={14} />)
  if (finish.key === 'landscaped') {
    els.push(<path key="path" d={`M ${W * 0.1} ${H * 0.85} Q ${W * 0.5} ${H * 0.45} ${W * 0.9} ${H * 0.6}`} stroke="#D9CFBB" strokeWidth={Math.max(8, W * 0.09)} fill="none" strokeLinecap="round" />)
    els.push(<path key="path-out" d={`M ${W * 0.1} ${H * 0.85} Q ${W * 0.5} ${H * 0.45} ${W * 0.9} ${H * 0.6}`} stroke={OUTLINE} strokeWidth={1} fill="none" opacity={0.3} strokeDasharray="3 5" />)
  }
  if (finish.key === 'trees' || finish.key === 'landscaped') {
    const trees = finish.key === 'landscaped' ? 1 : 2
    for (let t = 0; t < trees; t++) {
      const tx = W * (0.25 + t * 0.45)
      const ty = H * (0.3 + t * 0.25)
      const tr = Math.min(W, H) * 0.16
      els.push(<circle key={'t' + t} cx={tx} cy={ty} r={tr} fill={shade(color, -55)} stroke={OUTLINE} strokeWidth={SW} />)
    }
  }
  if (finish.key === 'lawn') {
    for (let i = 0; i < 5; i++) els.push(<circle key={'f' + i} cx={r() * W} cy={r() * H} r={1.8} fill={GOLD} opacity={0.85} />)
  }
  return els
}

// Every room type's base furniture tier, redrawn in the bold-outline,
// material-coded, proportion-correct language. Structurally mirrors
// softDepth.js's drawFurniture (same room-type branches, same size
// thresholds), only the shapes/colours/proportions differ.
function drawFurniture({ type, W, H, tier, finishKey }) {
  const set = tier
  const els = []

  if (type === 'living' && W > 60 && H > 55) {
    // Sofa: wide + shallow (seating proportion rule).
    if (set >= 1) els.push(rug('rug', W * 0.15, H * 0.24, W * 0.6, H * 0.55))
    els.push(<rect key="sofa-back" x={W * 0.2} y={H * 0.28} width={W * 0.46} height={H * 0.06} rx={3} fill={SEATING} stroke={OUTLINE} strokeWidth={SW} />)
    els.push(<rect key="sofa" x={W * 0.2} y={H * 0.32} width={W * 0.46} height={H * 0.16} rx={6} fill={SEATING} stroke={OUTLINE} strokeWidth={SW} />)
    if (set >= 2) els.push(<rect key="sofaL" x={W * 0.2} y={H * 0.32} width={W * 0.11} height={H * 0.36} rx={6} fill={SEATING} stroke={OUTLINE} strokeWidth={SW} />)
    els.push(<circle key="tbl" cx={W * 0.45} cy={H * 0.62} r={Math.min(W, H) * 0.08} fill={GOLD} stroke={OUTLINE} strokeWidth={SW} />)
    if (set >= 1) {
      els.push(<rect key="tv" x={W * 0.24} y={H * 0.9} width={W * 0.38} height={5} rx={2} fill={WOOD} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
      els.push(<circle key="arm1" cx={W * 0.72} cy={H * 0.36} r={Math.min(W, H) * 0.065} fill={SEATING} stroke={OUTLINE} strokeWidth={SW} />)
      els.push(<circle key="arm2" cx={W * 0.72} cy={H * 0.56} r={Math.min(W, H) * 0.065} fill={SEATING} stroke={OUTLINE} strokeWidth={SW} />)
    }
    if (set >= 2 && W > 100) {
      els.push(<rect key="dt" x={W * 0.78} y={H * 0.14} width={W * 0.15} height={H * 0.3} rx={4} fill={GOLD} stroke={OUTLINE} strokeWidth={SW} />)
      for (let i = 0; i < 4; i++)
        els.push(<circle key={'ch' + i} cx={W * 0.78 + (i % 2) * W * 0.15 + (i % 2 ? 5 : -5)} cy={H * 0.19 + Math.floor(i / 2) * H * 0.18} r={3.4} fill={SEATING} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
      els.push(<rect key="bar" x={W * 0.68} y={H * 0.82} width={W * 0.26} height={H * 0.09} rx={3} fill={WOOD} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
      els.push(<circle key="st1" cx={W * 0.74} cy={H * 0.77} r={3} fill={SEATING} stroke={OUTLINE} strokeWidth={1} />)
      els.push(<circle key="st2" cx={W * 0.85} cy={H * 0.77} r={3} fill={SEATING} stroke={OUTLINE} strokeWidth={1} />)
    }
  }

  if ((type === 'bedroom' || type === 'master') && W > 50 && H > 50) {
    // Bed: narrow + long (portrait) — deliberately not the sofa's wide
    // silhouette, per the "anything lain-on stays portrait" rule.
    const bw = type === 'master' ? 0.4 : 0.34
    const bh = type === 'master' ? 0.68 : 0.62
    const bx = W * 0.32
    const by = H * 0.1
    els.push(<rect key="bed-frame" x={bx} y={by} width={W * bw} height={H * bh} rx={5} fill={WOOD} stroke={OUTLINE} strokeWidth={SW} />)
    els.push(<rect key="mattress" x={bx + 3} y={by + 3} width={W * bw - 6} height={H * bh - 6} rx={4} fill={BEDDING} stroke={OUTLINE} strokeWidth={1} />)
    els.push(<rect key="pil" x={bx + 5} y={by + 5} width={W * bw - 10} height={H * bh * 0.16} rx={3} fill={BEDDING_LIGHT} stroke={OUTLINE} strokeWidth={1} />)
    if ((type === 'bedroom' && set >= 1) || (type === 'master' && W > 80)) {
      els.push(<rect key="ward" x={W * 0.05} y={H * 0.15} width={W * 0.12} height={H * 0.5} rx={3} fill={WOOD} stroke={OUTLINE} strokeWidth={SW} />)
    }
    if (type === 'master' && set >= 1) {
      els.push(<rect key="van" x={W * 0.05} y={H * 0.75} width={W * 0.22} height={H * 0.1} rx={3} fill={WOOD} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
      els.push(<circle key="rch" cx={W * 0.85} cy={H * 0.82} r={Math.min(W, H) * 0.06} fill={SEATING} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
    }
    if (type === 'master' && set >= 2) {
      els.push(<rect key="bench" x={W * 0.36} y={H * 0.86} width={W * 0.16} height={H * 0.07} rx={3} fill={SEATING} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
    }
  }

  if (type === 'kitchen' && W > 50) {
    els.push(<rect key="ctr" x={4} y={4} width={W - 8} height={H * 0.2} rx={3} fill={WOOD} stroke={OUTLINE} strokeWidth={SW} />)
    for (let i = 0; i < 4; i++)
      els.push(<circle key={'hob' + i} cx={W * 0.2 + (i % 2) * 12} cy={H * 0.1 + Math.floor(i / 2) * 9} r={3.5} fill="none" stroke={OUTLINE} strokeWidth={SW_SMALL} />)
    els.push(<rect key="sink" x={W * 0.65} y={H * 0.07} width={W * 0.18} height={H * 0.1} rx={3} fill={SOFT} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
    if (finishKey === 'island' || finishKey === 'chef') {
      els.push(<rect key="isl" x={W * 0.3} y={H * 0.45} width={W * 0.4} height={H * 0.2} rx={4} fill={GOLD} stroke={OUTLINE} strokeWidth={SW} />)
    }
    if (set >= 1 && H > 60) {
      els.push(<circle key="bt" cx={W * 0.25} cy={H * 0.8} r={Math.min(W, H) * 0.09} fill={GOLD} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
      els.push(<circle key="bs1" cx={W * 0.14} cy={H * 0.74} r={3} fill={SEATING} stroke={OUTLINE} strokeWidth={1} />)
      els.push(<circle key="bs2" cx={W * 0.36} cy={H * 0.86} r={3} fill={SEATING} stroke={OUTLINE} strokeWidth={1} />)
    }
  }

  if (type === 'bath' && H > 40) {
    els.push(<ellipse key="wc" cx={W * 0.3} cy={H * 0.78} rx={Math.min(W, H) * 0.12} ry={Math.min(W, H) * 0.15} fill={SOFT} stroke={OUTLINE} strokeWidth={SW} />)
    if (set === 0) {
      els.push(<rect key="shw" x={W * 0.55} y={6} width={W * 0.38} height={W * 0.38} rx={4} fill={SOFT} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
      els.push(<circle key="drain" cx={W * 0.74} cy={6 + W * 0.19} r={2} fill={OUTLINE} />)
    } else {
      els.push(<rect key="tub" x={W * 0.5} y={6} width={W * 0.42} height={H * 0.55} rx={10} fill={SOFT} stroke={OUTLINE} strokeWidth={SW} />)
      els.push(<circle key="tap" cx={W * 0.71} cy={10} r={2.5} fill={GOLD_DEEP} />)
    }
  }

  if (type === 'office' && W > 45) {
    els.push(<rect key="desk" x={W * 0.15} y={H * 0.12} width={W * 0.7} height={H * 0.18} rx={3} fill={WOOD} stroke={OUTLINE} strokeWidth={SW} />)
    els.push(<circle key="chair" cx={W * 0.5} cy={H * 0.45} r={Math.min(W, H) * 0.1} fill={SEATING} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
    if (set >= 1) {
      els.push(<rect key="bk1" x={4} y={H * 0.45} width={W * 0.1} height={H * 0.45} rx={2} fill={WOOD} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
      els.push(<circle key="guest" cx={W * 0.8} cy={H * 0.7} r={Math.min(W, H) * 0.08} fill={SEATING} stroke={OUTLINE} strokeWidth={1} />)
    }
  }

  if (type === 'veranda' && set >= 1 && W > 60) {
    els.push(<circle key="vc1" cx={W * 0.3} cy={H * 0.5} r={Math.min(W, H) * 0.16} fill={SEATING} stroke={OUTLINE} strokeWidth={SW} />)
    els.push(<circle key="vc2" cx={W * 0.5} cy={H * 0.5} r={Math.min(W, H) * 0.16} fill={SEATING} stroke={OUTLINE} strokeWidth={SW} />)
    els.push(<circle key="pl" cx={W * 0.82} cy={H * 0.5} r={Math.min(W, H) * 0.14} fill={GREEN} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
  }

  // Balcony Lounge tier only — the base "Railing" tier is the always-drawn
  // balustrade in drawFloor's main body, not furniture art.
  if (type === 'balcony' && set >= 1 && W > 40 && H > 30) {
    els.push(<circle key="bt" cx={W * 0.5} cy={H * 0.55} r={Math.min(W, H) * 0.16} fill={GOLD} stroke={OUTLINE} strokeWidth={SW} />)
    els.push(<circle key="bc1" cx={W * 0.28} cy={H * 0.4} r={4} fill={SEATING} stroke={OUTLINE} strokeWidth={1} />)
    els.push(<circle key="bc2" cx={W * 0.72} cy={H * 0.4} r={4} fill={SEATING} stroke={OUTLINE} strokeWidth={1} />)
  }

  if (type === 'garden' && W > 70 && H > 60) {
    if (set === 1) {
      els.push(<circle key="gt" cx={W * 0.5} cy={H * 0.55} r={Math.min(W, H) * 0.11} fill={GOLD} stroke={OUTLINE} strokeWidth={SW} />)
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + 0.5
        els.push(<circle key={'gc' + i} cx={W * 0.5 + Math.cos(a) * Math.min(W, H) * 0.18} cy={H * 0.55 + Math.sin(a) * Math.min(W, H) * 0.18} r={4} fill={SEATING} stroke={OUTLINE} strokeWidth={1} />)
      }
    }
    if (set === 2) {
      const cx = W * 0.5
      const cy = H * 0.55
      const R = Math.min(W, H) * 0.09
      els.push(<circle key="pit" cx={cx} cy={cy} r={R} fill="#4A4038" stroke={OUTLINE} strokeWidth={SW} />)
      els.push(<circle key="fire" cx={cx} cy={cy} r={R * 0.55} fill="#E08A2E" />)
      els.push(<circle key="fire2" cx={cx} cy={cy - 1.5} r={R * 0.28} fill="#F5C04A" />)
      els.push(<path key="bn1" d={`M ${cx - R * 2.6} ${cy - R * 0.8} A ${R * 2.6} ${R * 2.6} 0 0 1 ${cx - R * 0.8} ${cy - R * 2.6}`} fill="none" stroke={WOOD} strokeWidth={6} strokeLinecap="round" />)
      els.push(<path key="bn2" d={`M ${cx + R * 2.6} ${cy + R * 0.8} A ${R * 2.6} ${R * 2.6} 0 0 1 ${cx + R * 0.8} ${cy + R * 2.6}`} fill="none" stroke={WOOD} strokeWidth={6} strokeLinecap="round" />)
    }
  }

  if (type === 'pool' && set >= 1 && W > 60) {
    // Loungers: lain-on furniture, narrow + long, cream fill (bedding
    // material coding — you lie on a lounger the same as bedding).
    for (let i = 0; i < 2; i++) {
      els.push(<rect key={'lg' + i} x={8 + i * 18} y={H - 32} width={12} height={27} rx={4} fill={BEDDING} stroke={OUTLINE} strokeWidth={SW} />)
      els.push(<line key={'lgl' + i} x1={8 + i * 18 + 2} y1={H - 32 + 8} x2={8 + i * 18 + 10} y2={H - 32 + 8} stroke={OUTLINE} strokeWidth={1} opacity={0.5} />)
    }
    els.push(<circle key="umb" cx={52} cy={H - 14} r={9} fill={GOLD} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
    els.push(<circle key="umb2" cx={52} cy={H - 14} r={2} fill={GOLD_DEEP} />)
  }

  if (type === 'dsq' && set >= 1 && W > 50) {
    els.push(<rect key="db-frame" x={W * 0.58} y={H * 0.1} width={W * 0.28} height={H * 0.5} rx={4} fill={WOOD} stroke={OUTLINE} strokeWidth={SW} />)
    els.push(<rect key="db-mattress" x={W * 0.58 + 3} y={H * 0.1 + 3} width={W * 0.28 - 6} height={H * 0.5 - 6} rx={3} fill={BEDDING} stroke={OUTLINE} strokeWidth={1} />)
    els.push(<rect key="dk" x={4} y={4} width={W * 0.4} height={H * 0.14} rx={3} fill={WOOD} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
  }

  return els
}

function drawAddons({ type, W, H, addons }) {
  if (!addons || addons.length === 0) return []
  const has = (k) => addons.includes(k)
  const els = []

  if (type === 'living') {
    if (has('rug') && W > 50 && H > 45) els.push(rug('ad-rug', W * 0.06, H * 0.62, W * 0.3, H * 0.3))
    if (has('tv_console') && W > 55) els.push(<rect key="ad-tv" x={W * 0.05} y={H * 0.04} width={W * 0.26} height={H * 0.07} rx={3} fill={WOOD} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
    if (has('wall_art') && W > 55) els.push(<rect key="ad-art" x={W * 0.58} y={H * 0.03} width={W * 0.13} height={H * 0.09} rx={2} fill={GOLD} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
    if (has('plant') && Math.min(W, H) > 35) els.push(<circle key="ad-plant" cx={W * 0.92} cy={H * 0.9} r={Math.min(W, H) * 0.07} fill={GREEN} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
  }

  if (type === 'bedroom' || type === 'master') {
    const bw = type === 'master' ? 0.4 : 0.34
    if (has('headboard') && W > 45) els.push(<rect key="ad-hb" x={W * 0.31} y={H * 0.08} width={W * (bw + 0.02)} height={H * 0.04} rx={2} fill={WOOD} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
    if (has('bedside_lamp') && W > 45) els.push(<circle key="ad-lamp" cx={Math.max(4, W * 0.32 - 10)} cy={H * 0.14} r={3.5} fill={GOLD} stroke={OUTLINE} strokeWidth={1} />)
    if (has('rug') && W > 55 && H > 55) els.push(rug('ad-rug', W * 0.28, H * 0.8, W * (bw + 0.1), H * 0.12))
    if (has('bench') && W > 55 && H > 55) els.push(<rect key="ad-bench" x={W * 0.34} y={H * 0.79} width={W * bw} height={H * 0.06} rx={3} fill={SEATING} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
  }

  if (type === 'kitchen') {
    if (has('bar_stools') && W > 55 && H > 55) {
      els.push(<circle key="ad-bs1" cx={W * 0.18} cy={H * 0.85} r={3.2} fill={SEATING} stroke={OUTLINE} strokeWidth={1} />)
      els.push(<circle key="ad-bs2" cx={W * 0.3} cy={H * 0.85} r={3.2} fill={SEATING} stroke={OUTLINE} strokeWidth={1} />)
    }
    if (has('pendant_light') && W > 45) els.push(<circle key="ad-pl" cx={W * 0.5} cy={H * 0.06} r={4} fill={GOLD} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
  }

  if (type === 'bath') {
    if (has('bath_mat') && W > 35 && H > 45) els.push(rug('ad-mat', W * 0.08, H * 0.88, W * 0.28, H * 0.09, 3))
    if (has('wall_shelf') && H > 45) els.push(<rect key="ad-shelf" x={W * 0.05} y={H * 0.05} width={W * 0.24} height={4} rx={2} fill={WOOD} stroke={OUTLINE} strokeWidth={1} />)
  }

  if (type === 'garden') {
    if (has('string_lights') && W > 70)
      els.push(<path key="ad-sl" d={`M ${W * 0.1} ${H * 0.12} Q ${W * 0.5} ${H * 0.02} ${W * 0.9} ${H * 0.12}`} stroke={GOLD_DEEP} strokeWidth={1.5} fill="none" strokeDasharray="1 7" strokeLinecap="round" />)
    if (has('planters') && W > 60 && H > 50) {
      els.push(<circle key="ad-pot1" cx={W * 0.15} cy={H * 0.85} r={5} fill={WOOD} stroke={OUTLINE} strokeWidth={1} />)
      els.push(<circle key="ad-pot2" cx={W * 0.85} cy={H * 0.85} r={5} fill={WOOD} stroke={OUTLINE} strokeWidth={1} />)
    }
  }

  if (type === 'pool' && has('umbrella') && W > 55) {
    els.push(<circle key="ad-umb" cx={W * 0.85} cy={H * 0.18} r={10} fill={GOLD} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
    els.push(<circle key="ad-umb2" cx={W * 0.85} cy={H * 0.18} r={2.5} fill={GOLD_DEEP} />)
  }

  if (type === 'office') {
    if (has('desk_lamp') && W > 45) els.push(<circle key="ad-lamp" cx={W * 0.78} cy={H * 0.14} r={3} fill={GOLD} stroke={OUTLINE} strokeWidth={1} />)
    if (has('wall_art') && W > 45) els.push(<rect key="ad-art" x={W * 0.05} y={H * 0.05} width={W * 0.1} height={H * 0.12} rx={2} fill={GOLD} stroke={OUTLINE} strokeWidth={SW_SMALL} />)
  }

  if (type === 'veranda') {
    if (has('planters') && W > 55) {
      els.push(<circle key="ad-pot1" cx={W * 0.12} cy={H * 0.85} r={5} fill={WOOD} stroke={OUTLINE} strokeWidth={1} />)
      els.push(<circle key="ad-pot2" cx={W * 0.88} cy={H * 0.85} r={5} fill={WOOD} stroke={OUTLINE} strokeWidth={1} />)
    }
    if (has('string_lights') && W > 65)
      els.push(<path key="ad-sl" d={`M ${W * 0.1} ${H * 0.1} Q ${W * 0.5} 0 ${W * 0.9} ${H * 0.1}`} stroke={GOLD_DEEP} strokeWidth={1.5} fill="none" strokeDasharray="1 7" strokeLinecap="round" />)
  }

  if (type === 'dsq') {
    if (has('wall_shelf') && H > 45) els.push(<rect key="ad-shelf" x={W * 0.05} y={H * 0.06} width={W * 0.2} height={4} rx={2} fill={WOOD} stroke={OUTLINE} strokeWidth={1} />)
    if (has('curtains') && H > 45) els.push(<rect key="ad-curt" x={0} y={0} width={6} height={H * 0.3} fill={BEDDING} stroke={OUTLINE} strokeWidth={1} />)
  }

  if (type === 'balcony') {
    if (has('planters') && W > 45) {
      els.push(<circle key="ad-pot1" cx={W * 0.1} cy={H * 0.8} r={4.5} fill={WOOD} stroke={OUTLINE} strokeWidth={1} />)
      els.push(<circle key="ad-pot2" cx={W * 0.9} cy={H * 0.8} r={4.5} fill={WOOD} stroke={OUTLINE} strokeWidth={1} />)
    }
    if (has('string_lights') && W > 55)
      els.push(<path key="ad-sl" d={`M ${W * 0.08} ${H * 0.08} Q ${W * 0.5} ${-H * 0.02} ${W * 0.92} ${H * 0.08}`} stroke={GOLD_DEEP} strokeWidth={1.2} fill="none" strokeDasharray="1 6" strokeLinecap="round" />)
  }

  return els
}

function drawWalls({ roomDef, W, H, color }) {
  const els = []
  if (roomDef.indoor) {
    els.push(<rect key="wall" x={1.5} y={1.5} width={W - 3} height={H - 3} fill="none" stroke={OUTLINE} strokeWidth={2} rx={2} />)
    const wins = W > 100 ? 2 : 1
    for (let i = 0; i < wins; i++) {
      const wx = W * ((i + 1) / (wins + 1)) - 10
      els.push(<rect key={'win' + i} x={wx} y={0} width={20} height={5} fill="#FFF" stroke={OUTLINE} strokeWidth={1} />)
    }
    if (W > 40 && H > 40) {
      els.push(<path key="door" d={`M 8 ${H - 3} A 16 16 0 0 1 24 ${H - 19}`} fill="none" stroke={OUTLINE} strokeWidth={1.25} opacity={0.6} />)
      els.push(<rect key="doorgap" x={7} y={H - 5} width={17} height={5} fill={color} />)
    }
  }
  return els
}

export default {
  key: 'line-art',
  name: 'Line Art',
  drawFloor,
  drawPool,
  drawGarden,
  drawFurniture,
  drawAddons,
  drawWalls,
}
