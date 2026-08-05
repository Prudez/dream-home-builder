import { useEffect, useRef, useState } from 'react'
import { createSession, updateSessionShell, getCatalog } from './lib/api.js'
import { useEventQueue } from './hooks/useEventQueue.js'
import ConsentGate from './components/ConsentGate.jsx'
import ShellStage from './components/ShellStage.jsx'
import PlotCanvas from './components/PlotCanvas.jsx'
import RevealCard from './components/RevealCard.jsx'
import { T } from './lib/theme.js'
import { DEFAULT_STYLE_KEY } from './lib/roomStyles/index.js'

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

  // Illustration style (Phase 10): a pure rendering preference, switchable
  // live from PlotCanvas's always-visible switcher. Not tied to the shell
  // stage or any player design choice, and never sent to the server as part
  // of a room's data — only style_changed events record that it changed.
  const [styleKey, setStyleKey] = useState(DEFAULT_STYLE_KEY)

  const stageRef = useRef('consent')
  const designRef = useRef(null)
  const abandonedLoggedRef = useRef(false)

  const { logEvent } = useEventQueue(session?.id ?? null, () => {
    // Reaching the reveal card is a completion, not an abandonment — only
    // log if a session exists and the player never finished a design.
    if (abandonedLoggedRef.current || !session || designRef.current) return
    abandonedLoggedRef.current = true
    logEvent('session_abandoned', { stage: stageRef.current })
  })
  const loggedSessionStartRef = useRef(null)

  useEffect(() => {
    getCatalog()
      .then(setCatalog)
      .catch((err) => setCatalogError(err.message))
  }, [])

  useEffect(() => {
    designRef.current = design
  }, [design])

  useEffect(() => {
    stageRef.current = !session ? 'consent' : !shell ? 'shell' : 'building'
  }, [session, shell])

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

  function handleStyleChange(newStyleKey) {
    if (newStyleKey === styleKey) return
    setStyleKey(newStyleKey)
    logEvent('style_changed', { styleKey: newStyleKey })
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
        furnitureAddons={catalog.furnitureAddons}
        logEvent={logEvent}
        sessionId={session.id}
        styleKey={styleKey}
        onStyleChange={handleStyleChange}
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
          styleKey={styleKey}
        />
      )}
    </>
  )
}
