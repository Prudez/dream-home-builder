import { useEffect, useState } from 'react'

const MOBILE_QUERY = '(max-width: 640px)'

// Drives the palette's horizontal-scroll layout and the resize stepper's
// visibility. 640px comfortably covers the 375px test width plus typical
// phones in portrait without catching small tablets.
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  )

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const onChange = (e) => setIsMobile(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
