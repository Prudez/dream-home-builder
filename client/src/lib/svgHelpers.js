export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  const f = (v) => Math.max(0, Math.min(255, v + amt))
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`
}

// Deterministic per-room pseudo-random sequence, seeded from the room id,
// so texture speckle/grass-blade placement stays stable across re-renders.
export function rand(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}
