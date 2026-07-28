import { useState } from 'react'
import type { GameApi } from '../game/useGame'
import { Grid } from './Grid'
import { Keyboard } from './Keyboard'
import { ResultSheet } from './ResultSheet'

function fmtTimer(ms: number): { main: string; cs: string } {
  const sec = Math.floor(ms / 1000)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  const cs = Math.floor((ms % 1000) / 10)
  return { main: `${m}:${String(s).padStart(2, '0')}`, cs: `.${String(cs).padStart(2, '0')}` }
}

export function PlayScreen({ api }: { api: GameApi }) {
  const { phase, today, game, current, invalidShake, busy, elapsedMs, keyStates } = api
  const [sheetDismissed, setSheetDismissed] = useState(false)

  if (phase === 'loading') {
    return (
      <div className="center-card">
        <p className="muted">Loading today’s Punto…</p>
      </div>
    )
  }

  if (phase === 'offline') {
    return (
      <div className="center-card">
        <h2>Can’t reach the server</h2>
        <p className="muted">Check your connection and try again.</p>
        <button className="btn btn-primary" onClick={api.retry}>
          Retry
        </button>
      </div>
    )
  }

  if (phase === 'ready' || !game || !today) {
    return (
      <div className="center-card">
        <div className="start-logo" aria-hidden="true">
          <span className="tile c">P</span>
          <span className="tile p">U</span>
          <span className="tile a">N</span>
          <span className="tile c">T</span>
          <span className="tile p">O</span>
        </div>
        <h2>Punto #{today?.puzzle ?? '…'}</h2>
        <p className="muted">
          Guess the five-letter word in six tries. Fewer guesses, faster solve, fewer hints — more points.
        </p>
        <p className="small">⏱ The timer starts the moment you press play.</p>
        <button className="btn btn-primary btn-big" disabled={busy} onClick={() => void api.start()}>
          Play today’s Punto
        </button>
      </div>
    )
  }

  const done = game.status !== 'playing'
  const showSheet = done && !sheetDismissed
  const timer = fmtTimer(elapsedMs)

  return (
    <div className="play">
      <div className="board-area">
        <Grid
          rows={game.rows}
          current={current}
          maxGuesses={today.maxGuesses}
          wordLength={today.wordLength}
          invalidShake={invalidShake}
          done={done}
        />

        {game.hints.length > 0 && (
          <div className="hint-chips" aria-label="Hints">
            {game.hints.map(h => (
              <span key={h.pos} className="hint-chip">
                {h.letter.toUpperCase()} in spot {h.pos + 1}
              </span>
            ))}
          </div>
        )}
      </div>

      {!done && (
        <div className="cta">
          <button
            className="hint-btn"
            disabled={busy || game.hints.length >= today.maxHints}
            title={`Hint · ${today.hintCostNim} NIM (free in beta)`}
            onClick={() => void api.requestHint()}
          >
            <span className="hint-dot" aria-hidden="true" />
            Hint (−5 pts)
          </button>
          <div className="timer-box" aria-label="Timer">
            <span className="timer-dot" aria-hidden="true" />
            <span className="timer-digits">
              <span className="timer-main">{timer.main}</span>
              <span className="timer-cs">{timer.cs}</span>
            </span>
          </div>
        </div>
      )}

      <Keyboard keyStates={keyStates} onKey={api.pressKey} disabled={busy || done} />

      {done && sheetDismissed && (
        <button className="btn btn-ghost" onClick={() => setSheetDismissed(false)}>
          Show result
        </button>
      )}

      {showSheet && <ResultSheet game={game} streak={api.streak} onClose={() => setSheetDismissed(true)} />}
    </div>
  )
}
