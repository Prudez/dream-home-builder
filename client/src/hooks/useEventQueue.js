import { useCallback, useEffect, useRef } from 'react'
import { contract } from '../../../shared/contract.js'

const API_URL = import.meta.env.VITE_API_URL
const FLUSH_INTERVAL_MS = 4000
const FLUSH_SIZE_THRESHOLD = 20

// In-memory only: events live in a ref for the life of the tab, never in
// localStorage/sessionStorage. Flushes on an interval, on page hide (via
// sendBeacon so the request survives unload), and once the queue is large.
export function useEventQueue(sessionId) {
  const queueRef = useRef([])
  const startedAtRef = useRef(Date.now())
  const sessionIdRef = useRef(sessionId)

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

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
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush(true)
    }
    const onPageHide = () => flush(true)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [flush])

  return { logEvent }
}
