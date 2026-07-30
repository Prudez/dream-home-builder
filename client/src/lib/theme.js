// Blue Falcon design tokens. See docs/phases/PROMPTS.md Part 3 for the
// source design system. Never introduce colours outside this set.
export const T = {
  navy: '#0A1E3C',
  navyMid: '#13315C',
  ink: '#0B0B0D',
  white: '#FFFFFF',
  paper: '#F5F6F8',
  gold: '#C9A14A',
  goldDeep: '#A97F2C',
  green: '#4E7A57',
  slate: '#8B97A8',
  danger: '#B4453A',
  border: '#DDE2E9',
}

// Fixed rendering ink for room art (walls, furniture line drawings) — not
// catalogue data, so not fetched from the API. Derived from T.navy/white.
export const INK = {
  wall: '#26303B',
  furnitureFill: 'rgba(255,255,255,0.85)',
  furnitureDark: 'rgba(30,38,48,0.55)',
  furnitureDark2: 'rgba(30,38,48,0.7)',
}
