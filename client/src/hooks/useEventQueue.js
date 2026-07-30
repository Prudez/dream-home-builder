import { useCallback, useEffect, useRef } from 'react'
import { contract } from '../../../shared/contract.js'

const API_URL = import.meta.env.VITE_API_URL
const FLUSH_INTERVAL_MS = 4000
const FLUSH_SIZE_THRESHOLD = 20

// In-memory only: events live in a ref for the life of the tab, never in
// localStorage/sessionStorage. Flushes on an interval, on page hide (via
// sendBeacon so the request survives unload), and once the queue is large.
//
// `onHide` (optional) runs synchronously right before the page-hide flush,
// so a caller can push one last logEvent() call (e.g. session_abandoned)
// and be sure it's included — pushing to the queue any other way on hide
// would land after this hook's own flush already fired, with no second
// flush ever coming to send it.
export function useEventQueue(sessionId, onHide) {
  const queueRef = useRef([])
  const startedAtRef = useRef(Date.now())
  const sessionIdRef = useRef(sessionId)
  const onHideRef = useRef(onHide)

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  useEffect(() => {
    onHideRef.current = onHide
  }, [onHide])

  const flush = useCallback((useBeacon = false) => {
    const sid = sessionIdRef.current
    if (!sid || queueRef.current.length === 0) return
    const events = queueRef.current
    queueRef.current = []
    const body = JSON.stringify({ sessionId: sid, events })
    const url = `${API_URL}${contract.logEvent.path}`

    if (useBeacon && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon(url, blob)
      return
    }

    fetch(url, {
      method: contract.logEvent.method,
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: useBeacon,
    }).catch(() => {
      // Best-effort: dropped interaction events are acceptable, unlike
      // session/lead writes.
    })
  }, [])

  const logEvent = useCallback(
    (eventType, payload) => {
      const elapsedMs = Date.now() - startedAtRef.current
      queueRef.current.push({ eventType, payload, elapsedMs })
      if (queueRef.current.length >= FLUSH_SIZE_THRESHOLD) flush()
    },
    [flush]
  )

  useEffect(() => {
    const interval = setInterval(() => flush(), FLUSH_INTERVAL_MS)
    const onHidden = () => {
      onHideRef.current?.()
      flush(true)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') onHidden()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', onHidden)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', onHidden)
    }
  }, [flush])

  return { logEvent }
}
