import { memo } from 'react'
import { INK } from '../lib/theme.js'
import { shade, rand } from '../lib/svgHelpers.js'

// Ported from dream-home-builder-v4.jsx's drawFurniture(). `tier` replaces
// the prototype's `room.furn` int (now derived from the room's chosen
// catalog_furniture row's position in that room type's furniture list).
function drawFurniture(type, W, H, tier, finishKey) {
  const set = tier
  const F = INK.furnitureFill
  const FD = INK.furnitureDark
  const FD2 = INK.furnitureDark2
  const els = []

  if (type === 'living' && W > 60 && H > 55) {
    if (set >= 1) els.push(<rect key="rug" x={W * 0.18} y={H * 0.28} width={W * 0.55} height={H * 0.48} rx={6} fill="rgba(255,255,255,0.25)" />)
    els.push(<rect key="sofa" x={W * 0.22} y={H * 0.32} width={W * 0.42} height={H * 0.14} rx={5} fill={FD} />)
    els.push(<rect key="sofab" x={W * 0.22} y={H * 0.29} width={W * 0.42} height={H * 0.05} rx={3} fill={FD2} />)
    if (set >= 2) {
      els.push(<rect key="sofaL" x={W * 0.22} y={H * 0.32} width={W * 0.1} height={H * 0.34} rx={5} fill={FD} />)
    }
    els.push(<circle key="tbl" cx={W * 0.45} cy={H * 0.6} r={Math.min(W, H) * 0.075} fill={F} stroke={FD} strokeWidth={1.5} />)
    if (set >= 1) {
      els.push(<rect key="tv" x={W * 0.24} y={H * 0.9} width={W * 0.38} height={4} rx={2} fill={FD2} />)
      els.push(<circle key="arm1" cx={W * 0.72} cy={H * 0.36} r={Math.min(W, H) * 0.06} fill={FD} />)
      els.push(<circle key="arm2" cx={W * 0.72} cy={H * 0.55} r={Math.min(W, H) * 0.06} fill={FD} />)
    }
    if (set >= 2 && W > 100) {
      els.push(<rect key="dt" x={W * 0.78} y={H * 0.14} width={W * 0.15} height={H * 0.3} rx={4} fill={F} stroke={FD} strokeWidth={1.5} />)
      for (let i = 0; i < 4; i++)
        els.push(<circle key={'ch' + i} cx={W * 0.78 + (i % 2) * W * 0.15 + (i % 2 ? 5 : -5)} cy={H * 0.19 + Math.floor(i / 2) * H * 0.18} r={3.2} fill={FD} />)
      els.push(<rect key="bar" x={W * 0.68} y={H * 0.82} width={W * 0.26} height={H * 0.09} rx={3} fill={FD2} />)
      els.push(<circle key="st1" cx={W * 0.74} cy={H * 0.77} r={2.8} fill={FD} />)
      els.push(<circle key="st2" cx={W * 0.85} cy={H * 0.77} r={2.8} fill={FD} />)
    }
  }

  if ((type === 'bedroom' || type === 'master') && W > 50 && H > 50) {
    const bw = type === 'master' ? 0.44 : 0.4
    els.push(<rect key="bed" x={W * 0.3} y={H * 0.15} width={W * bw} height={H * 0.55} rx={5} fill={F} stroke={FD} strokeWidth={1.5} />)
    els.push(<rect key="pil" x={W * 0.33} y={H * 0.18} width={W * (bw - 0.06)} height={H * 0.12} rx={3} fill={FD} opacity={0.5} />)
    els.push(<line key="cov" x1={W * 0.3} y1={H * 0.42} x2={W * (0.3 + bw)} y2={H * 0.42} stroke={FD} strokeWidth={1.5} />)
    if ((type === 'bedroom' && set >= 1) || (type === 'master' && set >= 0 && W > 80)) {
      els.push(<rect key="ward" x={W * 0.05} y={H * 0.15} width={W * 0.12} height={H * 0.5} rx={3} fill={FD} opacity={0.55} />)
      els.push(<line key="wd" x1={W * 0.11} y1={H * 0.17} x2={W * 0.11} y2={H * 0.63} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />)
    }
    if (set >= 1) {
      els.push(<rect key="sd1" x={W * 0.3 - 9} y={H * 0.16} width={7} height={7} rx={2} fill={FD} />)
      els.push(<rect key="sd2" x={W * (0.3 + bw) + 2} y={H * 0.16} width={7} height={7} rx={2} fill={FD} />)
    }
    if (type === 'master' && set >= 1) {
      els.push(<rect key="van" x={W * 0.05} y={H * 0.75} width={W * 0.22} height={H * 0.1} rx={3} fill={F} stroke={FD} strokeWidth={1.2} />)
      els.push(<circle key="mir" cx={W * 0.16} cy={H * 0.72} r={4} fill="rgba(180,200,215,0.9)" stroke={FD} strokeWidth={1} />)
      els.push(<circle key="rch" cx={W * 0.85} cy={H * 0.82} r={Math.min(W, H) * 0.06} fill={FD} />)
    }
    if (type === 'master' && set >= 2) {
      els.push(<line key="rail" x1={W * 0.55} y1={H * 0.88} x2={W * 0.95} y2={H * 0.88} stroke={FD2} strokeWidth={2.5} />)
      for (let i = 0; i < 5; i++)
        els.push(<line key={'hg' + i} x1={W * (0.58 + i * 0.08)} y1={H * 0.88} x2={W * (0.58 + i * 0.08)} y2={H * 0.95} stroke={FD} strokeWidth={1.5} />)
      els.push(<rect key="bench" x={W * 0.35} y={H * 0.86} width={W * 0.14} height={H * 0.07} rx={3} fill={FD} />)
    }
  }

  if (type === 'kitchen' && W > 50) {
    els.push(<rect key="ctr" x={4} y={4} width={W - 8} height={H * 0.2} rx={3} fill="rgba(255,255,255,0.5)" stroke={FD} strokeWidth={1} />)
    for (let i = 0; i < 4; i++)
      els.push(<circle key={'hob' + i} cx={W * 0.2 + (i % 2) * 12} cy={H * 0.1 + Math.floor(i / 2) * 9} r={3.5} fill="none" stroke={FD} strokeWidth={1.5} />)
    els.push(<rect key="sink" x={W * 0.65} y={H * 0.07} width={W * 0.18} height={H * 0.1} rx={3} fill="rgba(180,200,215,0.9)" stroke={FD} strokeWidth={1} />)
    if (finishKey === 'island' || finishKey === 'chef') {
      els.push(<rect key="isl" x={W * 0.3} y={H * 0.45} width={W * 0.4} height={H * 0.2} rx={4} fill="rgba(255,255,255,0.6)" stroke={FD} strokeWidth={1.5} />)
    }
    if (set >= 1 && H > 60) {
      els.push(<circle key="bt" cx={W * 0.25} cy={H * 0.8} r={Math.min(W, H) * 0.09} fill={F} stroke={FD} strokeWidth={1.5} />)
      els.push(<circle key="bs1" cx={W * 0.14} cy={H * 0.74} r={3} fill={FD} />)
      els.push(<circle key="bs2" cx={W * 0.36} cy={H * 0.86} r={3} fill={FD} />)
    }
  }

  if (type === 'bath' && H > 40) {
    els.push(<ellipse key="wc" cx={W * 0.3} cy={H * 0.78} rx={Math.min(W, H) * 0.12} ry={Math.min(W, H) * 0.15} fill={F} stroke={FD} strokeWidth={1.5} />)
    if (set === 0) {
      els.push(<rect key="shw" x={W * 0.55} y={6} width={W * 0.38} height={W * 0.38} rx={4} fill="rgba(180,200,215,0.5)" stroke={FD} strokeWidth={1} />)
      els.push(<circle key="drain" cx={W * 0.74} cy={6 + W * 0.19} r={2} fill={FD} />)
    } else {
      els.push(<rect key="tub" x={W * 0.5} y={6} width={W * 0.42} height={H * 0.55} rx={10} fill="rgba(180,200,215,0.6)" stroke={FD} strokeWidth={1.5} />)
      els.push(<rect key="tubi" x={W * 0.5 + 5} y={11} width={W * 0.42 - 10} height={H * 0.55 - 10} rx={7} fill="rgba(220,235,242,0.8)" />)
      els.push(<circle key="tap" cx={W * 0.71} cy={10} r={2.5} fill={FD2} />)
    }
  }

  if (type === 'office' && W > 45) {
    els.push(<rect key="desk" x={W * 0.15} y={H * 0.12} width={W * 0.7} height={H * 0.18} rx={3} fill={F} stroke={FD} strokeWidth={1.5} />)
    els.push(<circle key="chair" cx={W * 0.5} cy={H * 0.45} r={Math.min(W, H) * 0.1} fill={FD} opacity={0.6} />)
    if (set >= 1) {
      els.push(<rect key="bk1" x={4} y={H * 0.45} width={W * 0.1} height={H * 0.45} rx={2} fill={FD2} />)
      for (let i = 0; i < 3; i++)
        els.push(<line key={'sh' + i} x1={5} y1={H * (0.55 + i * 0.11)} x2={4 + W * 0.1 - 1} y2={H * (0.55 + i * 0.11)} stroke="rgba(255,255,255,0.45)" strokeWidth={1} />)
      els.push(<circle key="guest" cx={W * 0.8} cy={H * 0.7} r={Math.min(W, H) * 0.08} fill={FD} opacity={0.5} />)
    }
  }

  if (type === 'veranda' && set >= 1 && W > 60) {
    els.push(<circle key="vc1" cx={W * 0.3} cy={H * 0.5} r={Math.min(W, H) * 0.16} fill={FD} opacity={0.55} />)
    els.push(<circle key="vc2" cx={W * 0.5} cy={H * 0.5} r={Math.min(W, H) * 0.16} fill={FD} opacity={0.55} />)
    els.push(<circle key="pl" cx={W * 0.82} cy={H * 0.5} r={Math.min(W, H) * 0.14} fill="#4E7A57" />)
    els.push(<circle key="pl2" cx={W * 0.82} cy={H * 0.5} r={Math.min(W, H) * 0.08} fill="#3A5F44" />)
  }

  if (type === 'garden' && W > 70 && H > 60) {
    if (set === 1) {
      els.push(<circle key="gt" cx={W * 0.5} cy={H * 0.55} r={Math.min(W, H) * 0.11} fill="rgba(250,248,240,0.9)" stroke={FD} strokeWidth={1.5} />)
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + 0.5
        els.push(
          <circle key={'gc' + i} cx={W * 0.5 + Math.cos(a) * Math.min(W, H) * 0.18} cy={H * 0.55 + Math.sin(a) * Math.min(W, H) * 0.18} r={4} fill={FD2} />
        )
      }
    }
    if (set === 2) {
      const cx = W * 0.5
      const cy = H * 0.55
      const R = Math.min(W, H) * 0.09
      els.push(<circle key="pit" cx={cx} cy={cy} r={R} fill="#4A4038" stroke="#2E2822" strokeWidth={2.5} />)
      els.push(<circle key="fire" cx={cx} cy={cy} r={R * 0.55} fill="#E08A2E" />)
      els.push(<circle key="fire2" cx={cx} cy={cy - 1.5} r={R * 0.28} fill="#F5C04A" />)
      els.push(
        <path key="bn1" d={`M ${cx - R * 2.6} ${cy - R * 0.8} A ${R * 2.6} ${R * 2.6} 0 0 1 ${cx - R * 0.8} ${cy - R * 2.6}`} fill="none" stroke="#8A6E4E" strokeWidth={6} strokeLinecap="round" />
      )
      els.push(
        <path key="bn2" d={`M ${cx + R * 2.6} ${cy + R * 0.8} A ${R * 2.6} ${R * 2.6} 0 0 1 ${cx + R * 0.8} ${cy + R * 2.6}`} fill="none" stroke="#8A6E4E" strokeWidth={6} strokeLinecap="round" />
      )
    }
  }

  if (type === 'pool' && set >= 1 && W > 60) {
    for (let i = 0; i < 2; i++) {
      els.push(
        <rect key={'lg' + i} x={10 + i * 20} y={H - 16} width={16} height={8} rx={3} fill="rgba(250,248,240,0.95)" stroke={FD} strokeWidth={1} transform={`rotate(-8 ${18 + i * 20} ${H - 12})`} />
      )
    }
    els.push(<circle key="umb" cx={52} cy={H - 14} r={9} fill="#C9A14A" opacity={0.9} />)
    els.push(<circle key="umb2" cx={52} cy={H - 14} r={2} fill="#8A6E2E" />)
  }

  if (type === 'dsq' && set >= 1 && W > 50) {
    els.push(<rect key="db" x={W * 0.55} y={H * 0.15} width={W * 0.32} height={H * 0.4} rx={4} fill={F} stroke={FD} strokeWidth={1.2} />)
    els.push(<rect key="dk" x={4} y={4} width={W * 0.4} height={H * 0.14} rx={3} fill="rgba(255,255,255,0.5)" stroke={FD} strokeWidth={1} />)
  }

  return els
}

// Ported from dream-home-builder-v4.jsx's RoomArt(). `finish` and
// `colorIndex` are already resolved (catalog data + the room's own
// choice); `furnitureTierIndex` is the 0-based position of the room's
// chosen catalog_furniture row within that room type's furniture list.
function RoomArt({ room, roomDef, cell, finish, colorIndex, furnitureTierIndex }) {
  const W = room.w * cell
  const H = room.h * cell
  const color = finish ? finish.colors[colorIndex]?.hex ?? finish.colors[0].hex : '#8B97A8'
  const r = rand(room.id * 7919 + 13)
  const els = []

  if (!finish) {
    els.push(<rect key="bg" width={W} height={H} fill={room.type === 'garage' ? '#9AA3AD' : '#B9C1CB'} />)
    if (room.type === 'garage') {
      els.push(<line key="g1" x1={W / 2} y1={6} x2={W / 2} y2={H - 6} stroke="#FFF" strokeWidth={2} strokeDasharray="8 6" opacity={0.6} />)
    }
    if (room.type === 'gate') {
      els.push(
        <g key="gt">
          {[...Array(6)].map((_, i) => (
            <rect key={i} x={4 + (i * (W - 8)) / 6} y={H * 0.25} width={3} height={H * 0.5} fill="#3A424C" />
          ))}
        </g>
      )
    }
    if (room.type === 'borehole') {
      els.push(<circle key="bh" cx={W / 2} cy={H / 2} r={Math.min(W, H) * 0.28} fill="#4E75A8" stroke={INK.wall} strokeWidth={3} />)
    }
  } else if (roomDef.groupName === 'pool') {
    const gid = `pw${room.id}`
    const coping = 7
    els.push(
      <defs key="d">
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={shade(color, 35)} />
          <stop offset="60%" stopColor={color} />
          <stop offset="100%" stopColor={shade(color, -35)} />
        </linearGradient>
      </defs>
    )
    els.push(<rect key="deck" width={W} height={H} rx={10} fill={finish.key === 'deck' ? '#D9CFB8' : '#DAD5CB'} />)
    if (finish.key === 'deck') {
      for (let x = 0; x < W; x += 14) els.push(<line key={'dk' + x} x1={x} y1={0} x2={x} y2={H} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />)
    }
    const infEdge = finish.key === 'infinity'
    els.push(
      <rect key="water" x={coping} y={coping} width={W - coping * 2} height={H - coping * (infEdge ? 1 : 2)} rx={8} fill={`url(#${gid})`} stroke={shade(color, -60)} strokeWidth={1.5} />
    )
    if (infEdge) {
      els.push(<rect key="inf" x={coping} y={H - 10} width={W - coping * 2} height={8} fill={shade(color, 60)} opacity={0.7} rx={4} />)
    }
    for (let i = 0; i < 3; i++) {
      const cx = W * (0.3 + r() * 0.4)
      const cy = H * (0.25 + r() * 0.4)
      els.push(<ellipse key={'rp' + i} cx={cx} cy={cy} rx={W * 0.14} ry={W * 0.05} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />)
      els.push(<ellipse key={'rp2' + i} cx={cx} cy={cy} rx={W * 0.07} ry={W * 0.025} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />)
    }
    els.push(<path key="sh" d={`M ${coping + 6} ${H * 0.7} Q ${W * 0.4} ${H * 0.6} ${W - coping - 6} ${H * 0.72}`} stroke="rgba(255,255,255,0.25)" strokeWidth={2} fill="none" />)
    els.push(
      <g key="lad" stroke="#EFEFEF" strokeWidth={2.5} strokeLinecap="round">
        <line x1={W - coping - 14} y1={coping + 2} x2={W - coping - 14} y2={coping + 16} />
        <line x1={W - coping - 6} y1={coping + 2} x2={W - coping - 6} y2={coping + 16} />
        <line x1={W - coping - 14} y1={coping + 7} x2={W - coping - 6} y2={coping + 7} />
        <line x1={W - coping - 14} y1={coping + 13} x2={W - coping - 6} y2={coping + 13} />
      </g>
    )
  } else if (roomDef.groupName === 'garden') {
    els.push(<rect key="bg" width={W} height={H} fill={color} rx={14} />)
    for (let x = 0; x < W; x += 18) els.push(<rect key={'st' + x} x={x} y={0} width={9} height={H} fill="rgba(255,255,255,0.05)" />)
    for (let i = 0; i < Math.min(90, (W * H) / 90); i++) {
      const x = r() * W
      const y = r() * H
      els.push(<path key={'b' + i} d={`M ${x} ${y} q 1.5 -4 3 -5`} stroke={shade(color, -30)} strokeWidth={1} fill="none" opacity={0.6} />)
    }
    if (finish.key === 'landscaped') {
      els.push(<path key="path" d={`M ${W * 0.1} ${H * 0.85} Q ${W * 0.5} ${H * 0.45} ${W * 0.9} ${H * 0.6}`} stroke="#D9CFBB" strokeWidth={Math.max(8, W * 0.09)} fill="none" strokeLinecap="round" />)
      els.push(<path key="path2" d={`M ${W * 0.1} ${H * 0.85} Q ${W * 0.5} ${H * 0.45} ${W * 0.9} ${H * 0.6}`} stroke="rgba(0,0,0,0.08)" strokeWidth={1.5} fill="none" strokeDasharray="3 5" />)
      for (let i = 0; i < 4; i++) {
        const t = 0.18 + i * 0.2
        const px = W * (0.1 + t * 0.8)
        const py = H * (0.85 - Math.sin(t * Math.PI) * 0.32) - 12
        els.push(<circle key={'sh' + i} cx={px} cy={py} r={5 + r() * 3} fill={shade(color, -45)} />)
      }
    }
    if (finish.key === 'trees' || finish.key === 'landscaped') {
      const trees = finish.key === 'landscaped' ? 1 : 2
      for (let t = 0; t < trees; t++) {
        const tx = W * (0.25 + t * 0.45)
        const ty = H * (0.3 + t * 0.25)
        const tr = Math.min(W, H) * 0.16
        els.push(<ellipse key={'tsh' + t} cx={tx + tr * 0.3} cy={ty + tr * 0.4} rx={tr * 1.1} ry={tr * 0.5} fill="rgba(0,0,0,0.15)" />)
        els.push(<circle key={'t1' + t} cx={tx} cy={ty} r={tr} fill={shade(color, -55)} />)
        els.push(<circle key={'t2' + t} cx={tx - tr * 0.45} cy={ty + tr * 0.25} r={tr * 0.65} fill={shade(color, -40)} />)
        els.push(<circle key={'t3' + t} cx={tx + tr * 0.5} cy={ty + tr * 0.2} r={tr * 0.6} fill={shade(color, -68)} />)
        els.push(<circle key={'t4' + t} cx={tx + tr * 0.1} cy={ty - tr * 0.4} r={tr * 0.5} fill={shade(color, -30)} />)
      }
    }
    if (finish.key === 'lawn') {
      for (let i = 0; i < 5; i++) {
        els.push(<circle key={'f' + i} cx={r() * W} cy={r() * H} r={1.8} fill={['#E8D26E', '#E8A0A0', '#FFF'][i % 3]} opacity={0.8} />)
      }
    }
  } else {
    els.push(<rect key="bg" width={W} height={H} fill={color} />)
    if (finish.texture === 'tile') {
      const s = Math.max(12, cell / 2.4)
      for (let x = s; x < W; x += s) els.push(<line key={'tx' + x} x1={x} y1={0} x2={x} y2={H} stroke="rgba(0,0,0,0.09)" strokeWidth={1} />)
      for (let y = s; y < H; y += s) els.push(<line key={'ty' + y} x1={0} y1={y} x2={W} y2={y} stroke="rgba(0,0,0,0.09)" strokeWidth={1} />)
    } else if (finish.texture === 'plank') {
      const ph = Math.max(8, cell / 4)
      for (let y = 0; y < H; y += ph) {
        els.push(<line key={'pl' + y} x1={0} y1={y} x2={W} y2={y} stroke="rgba(0,0,0,0.14)" strokeWidth={1} />)
        const off = (Math.floor(y / ph) % 2) * W * 0.3 + W * 0.2
        els.push(<line key={'pj' + y} x1={off % W} y1={y} x2={off % W} y2={y + ph} stroke="rgba(0,0,0,0.1)" strokeWidth={1} />)
      }
    } else if (finish.texture === 'parquet') {
      const s = Math.max(10, cell / 3)
      for (let i = -H; i < W; i += s) {
        els.push(<line key={'d1' + i} x1={i} y1={0} x2={i + H} y2={H} stroke="rgba(0,0,0,0.10)" strokeWidth={1} />)
        els.push(<line key={'d2' + i} x1={i + H} y1={0} x2={i} y2={H} stroke="rgba(0,0,0,0.07)" strokeWidth={1} />)
      }
    } else if (finish.texture === 'gloss') {
      const s = Math.max(20, cell)
      for (let x = s; x < W; x += s) els.push(<line key={'gx' + x} x1={x} y1={0} x2={x} y2={H} stroke="rgba(0,0,0,0.05)" strokeWidth={1} />)
      for (let y = s; y < H; y += s) els.push(<line key={'gy' + y} x1={0} y1={y} x2={W} y2={y} stroke="rgba(0,0,0,0.05)" strokeWidth={1} />)
      els.push(<polygon key="sheen" points={`0,${H * 0.2} ${W * 0.35},0 ${W * 0.55},0 0,${H * 0.55}`} fill="rgba(255,255,255,0.22)" />)
    } else if (finish.texture === 'carpet') {
      for (let i = 0; i < (W * H) / 60; i++) els.push(<circle key={'c' + i} cx={r() * W} cy={r() * H} r={0.9} fill="rgba(0,0,0,0.10)" />)
    } else if (finish.texture === 'granite') {
      for (let i = 0; i < (W * H) / 40; i++) {
        els.push(<circle key={'gr' + i} cx={r() * W} cy={r() * H} r={0.8 + r() * 1.4} fill={r() > 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.2)'} />)
      }
    }
  }

  if (!['gate', 'borehole', 'garage'].includes(room.type)) {
    els.push(<g key="furniture">{drawFurniture(room.type, W, H, furnitureTierIndex, finish ? finish.key : null)}</g>)
  }

  if (roomDef.indoor) {
    els.push(<rect key="wall" x={2} y={2} width={W - 4} height={H - 4} fill="none" stroke={INK.wall} strokeWidth={4} rx={2} />)
    const wins = W > 100 ? 2 : 1
    for (let i = 0; i < wins; i++) {
      const wx = W * ((i + 1) / (wins + 1)) - 10
      els.push(<rect key={'win' + i} x={wx} y={0} width={20} height={5} fill="#FFF" stroke={INK.wall} strokeWidth={0.8} />)
    }
    if (W > 40 && H > 40) {
      els.push(<path key="door" d={`M 8 ${H - 3} A 16 16 0 0 1 24 ${H - 19}`} fill="none" stroke={INK.wall} strokeWidth={1} opacity={0.5} />)
      els.push(<rect key="doorgap" x={7} y={H - 5} width={17} height={5} fill={color} />)
    }
  }

  return (
    <svg
      width={W - 3}
      height={H - 3}
      viewBox={`0 0 ${W} ${H}`}
      style={{
        display: 'block',
        width: W - 3,
        height: H - 3,
        flexShrink: 0,
        borderRadius: roomDef.groupName === 'garden' ? 14 : 6,
        pointerEvents: 'none',
      }}
    >
      {els}
    </svg>
  )
}

// Re-rendered per room on every PlotCanvas state change; PlotCanvas's
// immutable setPlaced updates only replace the object for the room that
// actually changed, so memoizing here skips redrawing every *other* room's
// SVG (walls, textures, furniture) on each interaction.
export default memo(RoomArt)
