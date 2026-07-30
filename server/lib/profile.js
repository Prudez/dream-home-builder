// Profile label and listing-match logic. Ported from the prototype
// (dream-home-builder-v4.jsx lines 704-713 for profileLabel, matching is
// new for Phase 4 since the prototype's three listings were static text).
// Runs server-side only — the client renders whatever this returns and
// never re-derives it, so results can't be spoofed and stay reusable for
// Phase 5's lead-scoring job.

export function furnitureTier(room, furnitureByRoomType) {
  if (room.furnitureId == null) return 0
  const list = furnitureByRoomType[room.type]
  if (!list) return 0
  const idx = list.findIndex((f) => f.id === room.furnitureId)
  return idx < 0 ? 0 : idx
}

export function computeProfileLabel({ rooms, floors, stylePack, furnitureByRoomType }) {
  const has = (type) => rooms.some((r) => r.type === type)
  const tier = (r) => furnitureTier(r, furnitureByRoomType)
  const beds = rooms.filter((r) => r.type === 'bedroom' || r.type === 'master').length

  if (
    rooms.some((r) => r.type === 'living' && tier(r) === 2) ||
    rooms.some((r) => r.type === 'garden' && tier(r) === 2)
  ) {
    return 'The Host'
  }
  if (has('pool') && floors >= 2) return 'The Statement Builder'
  if (has('office') && (has('dsq') || has('garage'))) return 'The Executive'
  if (beds >= 3) return 'The Family Nester'
  if (stylePack === 'compact') return 'The Smart Starter'
  return 'The Modern Minimalist'
}

export function matchListings(listings, { stylePack, total, bedrooms }) {
  const scored = listings.map((listing) => {
    let score = 0
    if (listing.stylePacks?.includes(stylePack)) score += 3
    if (bedrooms >= listing.minBedrooms && (listing.maxBedrooms == null || bedrooms <= listing.maxBedrooms)) {
      score += 2
    }
    if (listing.priceMin == null || total >= Number(listing.priceMin)) score += 1
    if (listing.priceMax == null || total <= Number(listing.priceMax)) score += 1
    return { listing, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const top = scored.filter((s) => s.score > 0).slice(0, 3)
  return (top.length > 0 ? top : scored.slice(0, 3)).map((s) => s.listing)
}
