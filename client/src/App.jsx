import { useEffect, useRef, useState } from 'react'
import { createSession, updateSessionShell, getCatalog } from './lib/api.js'
import { useEventQueue } from './hooks/useEventQueue.js'
import ConsentGate from './components/ConsentGate.jsx'
import ShellStage from './components/ShellStage.jsx'
import PlotCanvas from './components/PlotCanvas.jsx'
import RevealCard from './components/RevealCard.jsx'
import { T } from './lib/theme.js'

function detectDevice() {
  return /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
}

export default function App() {
  const [session, setSession] = useState(null)
  const [sessionError, setSessionError] = useState(null)

  const [catalog, setCatalog] = useState(null)
  const [catalogError, setCatalogError] = useState(null)
  const [shell, setShell] = useState(null)

  const [design, setDesign] = useState(null)
  const [matches, setMatches] = useState([])
  const [showReveal, setShowReveal] = useState(false)

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
    setSessionError(null)
    try {
      const { session } = await createSession({ consent: true, device: detectDevice() })
      setSession(session)
    } catch (err) {
      setSessionError({ code: err.code, message: err.message })
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
    return <ConsentGate onStart={startSession} error={sessionError} />
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
    <>
      <PlotCanvas
        rooms={catalog.rooms}
        shells={catalog.shells}
        shellKey={shell.shellKey}
        floorsCount={shell.floors}
        stylePacks={catalog.stylePacks}
        stylePackKey={shell.stylePack}
        finishes={catalog.finishes}
        furniture={catalog.furniture}
        logEvent={logEvent}
        sessionId={session.id}
        onDesignFinished={(newDesign, newMatches) => {
          setDesign(newDesign)
          setMatches(newMatches)
          setShowReveal(true)
        }}
      />
      {showReveal && design && (
        <RevealCard
          catalog={catalog}
          shell={shell}
          design={design}
          matches={matches}
          sessionId={session.id}
          logEvent={logEvent}
          onClose={() => setShowReveal(false)}
        />
      )}
    </>
  )
}
