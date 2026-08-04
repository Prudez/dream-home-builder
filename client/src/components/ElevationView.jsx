// Front-elevation SVG render, shown on the reveal card alongside the
// existing top-down mini floorplan (RevealCard.jsx) but built as its own
// component — it works from the full multi-floor room list, not the
// per-floor PlotCanvas the top-down view renders from, and draws a
// completely different projection (a stacked side-on facade, not a grid).
//
// Floor footprint width is derived from the actual placed rooms on each
// floor (their grid x-extent), not a fixed constant, so a maisonette with a
// narrower first floor (e.g. a balcony setback) reads as narrower there too.
// Roof shape comes from the chosen style pack. Window count per floor is
// driven by that floor's bedroom count (bedroom + master), with a floor of
// at least 1 so a floor made only of e.g. a living room + kitchen doesn't
// render as a blank wall.

const ROOF_BY_PACK = {
  minimalist: 'flat',
  compact: 'flat',
  coastal: 'hip',
  stone: 'gable',
}

const CELL_PX = 14
const FLOOR_H = 46
const ROOF_H = 34
const MARGIN = 16
const OUTLINE = '#26303B'

function floorFootprintCells(rooms, floor) {
  const floorRooms = rooms.filter((r) => r.floor === floor)
  if (floorRooms.length === 0) return null
  const minX = Math.min(...floorRooms.map((r) => r.x))
  const maxX = Math.max(...floorRooms.map((r) => r.x + r.w))
  return maxX - minX
}

function bedroomCount(rooms, floor) {
  return rooms.filter((r) => r.floor === floor && (r.type === 'bedroom' || r.type === 'master')).length
}

function Roof({ shape, x, width, baseY }) {
  const apexY = baseY - ROOF_H
  if (shape === 'flat') {
    const parapetH = 12
    return (
      <g key="roof">
        <rect x={x - 4} y={baseY - parapetH} width={width + 8} height={parapetH} fill={OUTLINE} opacity={0.85} />
        <rect x={x - 6} y={baseY - parapetH - 4} width={width + 12} height={4} fill={OUTLINE} />
      </g>
    )
  }
  if (shape === 'hip') {
    const ridgeW = width * 0.35
    const ridgeX1 = x + (width - ridgeW) / 2
    const ridgeX2 = ridgeX1 + ridgeW
    return (
      <g key="roof">
        <polygon
          points={`${x - 6},${baseY} ${ridgeX1},${apexY} ${ridgeX2},${apexY} ${x + width + 6},${baseY}`}
          fill="#8A4B2D"
          stroke={OUTLINE}
          strokeWidth={1.5}
        />
        <line x1={ridgeX1} y1={apexY} x2={ridgeX2} y2={apexY} stroke={OUTLINE} strokeWidth={1.5} />
      </g>
    )
  }
  // gable — pitched, comes to a single ridge point
  return (
    <g key="roof">
      <polygon
        points={`${x - 6},${baseY} ${x + width / 2},${apexY} ${x + width + 6},${baseY}`}
        fill="#5C6167"
        stroke={OUTLINE}
        strokeWidth={1.5}
      />
    </g>
  )
}

export default function ElevationView({ rooms, floors, stylePackKey, wallColor }) {
  const roofShape = ROOF_BY_PACK[stylePackKey] ?? 'flat'

  const rawWidths = Array.from({ length: floors }, (_, i) => floorFootprintCells(rooms, i))
  const fallbackWidth = rawWidths.find((w) => w != null) ?? 6
  const widthsCells = rawWidths.map((w) => (w != null && w > 0 ? w : fallbackWidth))
  const maxWidthCells = Math.max(...widthsCells)

  const bodyWidth = maxWidthCells * CELL_PX
  const svgWidth = bodyWidth + MARGIN * 2
  const bodyHeight = floors * FLOOR_H
  const svgHeight = bodyHeight + ROOF_H + MARGIN * 2

  const wall = wallColor ?? '#E8E2D4'

  const els = []
  let topFloorX = MARGIN + bodyWidth / 2
  let topFloorW = bodyWidth
  let topFloorY = MARGIN + ROOF_H

  for (let i = 0; i < floors; i++) {
    const w = widthsCells[i] * CELL_PX
    const x = MARGIN + (bodyWidth - w) / 2
    const y = MARGIN + ROOF_H + (floors - 1 - i) * FLOOR_H

    if (i === floors - 1) {
      topFloorX = x
      topFloorW = w
      topFloorY = y
    }

    els.push(<rect key={`wall${i}`} x={x} y={y} width={w} height={FLOOR_H} fill={wall} stroke={OUTLINE} strokeWidth={1.5} />)

    const winCount = Math.max(1, bedroomCount(rooms, i))
    const winW = 14
    const gap = w / (winCount + 1)
    for (let wi = 0; wi < winCount; wi++) {
      const wx = x + gap * (wi + 1) - winW / 2
      els.push(
        <g key={`win${i}-${wi}`}>
          <rect x={wx} y={y + FLOOR_H * 0.32} width={winW} height={FLOOR_H * 0.4} fill="#EAF2F6" stroke={OUTLINE} strokeWidth={1} />
          <line x1={wx + winW / 2} y1={y + FLOOR_H * 0.32} x2={wx + winW / 2} y2={y + FLOOR_H * 0.72} stroke={OUTLINE} strokeWidth={0.75} />
        </g>
      )
    }

    if (i === 0) {
      const doorW = 20
      const doorH = FLOOR_H * 0.78
      const doorX = x + w / 2 - doorW / 2
      const doorY = y + FLOOR_H - doorH
      els.push(<rect key="door" x={doorX} y={doorY} width={doorW} height={doorH} fill="#6B4226" stroke={OUTLINE} strokeWidth={1} />)
      els.push(<circle key="doorknob" cx={doorX + doorW - 4} cy={doorY + doorH / 2} r={1.5} fill="#C9A14A" />)
    }
  }

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width={svgWidth} height={svgHeight} style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }}>
      {els}
      <Roof shape={roofShape} x={topFloorX} width={topFloorW} baseY={topFloorY} />
      <line x1={MARGIN - 6} y1={svgHeight - MARGIN} x2={svgWidth - MARGIN + 6} y2={svgHeight - MARGIN} stroke={OUTLINE} strokeWidth={2} />
    </svg>
  )
}
