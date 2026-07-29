import { useEffect, useRef, useState } from 'react'
import { createSession, updateSessionShell, getCatalog } from './lib/api.js'
import { useEventQueue } from './hooks/useEventQueue.js'
import ShellStage from './components/ShellStage.jsx'
import PlotCanvas from './components/PlotCanvas.jsx'
import { T } from './lib/theme.js'

function detectDevice() {
  return /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
}

export default function App() {
  const [consent, setConsent] = useState(false)
  const [session, setSession] = useState(null)
  const [sessionError, setSessionError] = useState(null)
  const [creatingSession, setCreatingSession] = useState(false)

  const [catalog, setCatalog] = useState(null)
  const [catalogError, setCatalogError] = useState(null)
  const [shell, setShell] = useState(null)

  const { logEvent } = useEventQueue(session?.id ?? null)
  const loggedSessionStartRef = useRef(null)

  useEffect(() => {
    getCatalog()
      .then(setCatalog)
      .catch((err) => setCatalogError(err.message))
  }, [])

  useEffect(() => {
    if (session && loggedSessionStartRef.current !== session.id) {
      loggedSessionStartRef.current = session.id
      logEvent('session_start', { device: session.device })
    }
  }, [session, logEvent])

  async function startSession() {
    setCreatingSession(true)
    setSessionError(null)
    try {
      const { session } = await createSession({ consent: true, device: detectDevice() })
      setSession(session)
    } catch (err) {
      setSessionError({ code: err.code, message: err.message })
    } finally {
      setCreatingSession(false)
    }
  }

  async function handleShellStart({ shellKey, floors, stylePack }) {
    try {
      await updateSessionShell(session.id, { stylePack, floors })
    } catch (err) {
      console.error('Failed to save shell choice to the session:', err.message)
    }
    logEvent('shell_chosen', { shellKey, floors, stylePack })
    setShell({ shellKey, floors, stylePack })
  }

  if (!session) {
    return (
      <main style={{ fontFamily: 'sans-serif', maxWidth: 480, margin: '40px auto', padding: '0 16px' }}>
        <h1>Dream Home Builder</h1>
        <p>Design your dream home in five minutes.</p>

        <section style={{ marginTop: 24 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            We use your answers to recommend properties. I consent.
          </label>

          <button
            type="button"
            disabled={!consent || creatingSession}
            onClick={startSession}
            style={{ marginTop: 12 }}
          >
            {creatingSession ? 'Starting…' : 'Start session'}
          </button>

          {sessionError && <pre style={{ color: T.danger }}>{JSON.stringify(sessionError, null, 2)}</pre>}
        </section>
      </main>
    )
  }

  if (catalogError) {
    return <div style={{ padding: 40, color: T.danger }}>Failed to load the catalogue: {catalogError}</div>
  }

  if (!catalog) {
    return <div style={{ padding: 40 }}>Loading…</div>
  }

  if (!shell) {
    return <ShellStage shells={catalog.shells} stylePacks={catalog.stylePacks} onStart={handleShellStart} />
  }

  return (
    <PlotCanvas
      rooms={catalog.rooms}
      shells={catalog.shells}
      shellKey={shell.shellKey}
      floorsCount={shell.floors}
      logEvent={logEvent}
    />
  )
}
