import { useEffect, useRef, useState } from 'react'
import type { GameApi } from '../game/useGame'
import { Grid } from './Grid'
import { Keyboard } from './Keyboard'
import { ResultSheet } from './ResultSheet'

// Whole seconds only: the timer ticks up exactly as the points drain
// down, so the two visibly move together.
function fmtTimer(ms: number): string {
  const sec = Math.floor(ms / 1000)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const WIN_CELEBRATION_MS = 3800
const LOSS_PAUSE_MS = 1400

export function PlayScreen({ api }: { api: GameApi }) {
  const { phase, today, game, mode, current, invalidShake, busy, elapsedMs, keyStates } = api
  const [sheetDismissed, setSheetDismissed] = useState(false)
  const [confirmHint, setConfirmHint] = useState(false)
  const [celebrating, setCelebrating] = useState<null | 'won' | 'lost'>(null)
  const prevStatus = useRef<string | null>(null)

  // Wordle-style finish: when a game ends live (not on reload), let the
  // winning row dance and show "Correct!" for a beat before the sheet.
  useEffect(() => {
    const status = game ? `${game.mode}:${game.status}` : null
    const prev = prevStatus.current
    prevStatus.current = status
    if (!game || game.status === 'playing') return
    if (prev === `${game.mode}:playing`) {
      const kind = game.status === 'won' ? 'won' : 'lost'
      setCelebrating(kind)
      setSheetDismissed(false)
      const id = window.setTimeout(
        () => setCelebrating(null),
        kind === 'won' ? WIN_CELEBRATION_MS : LOSS_PAUSE_MS,
      )
      return () => window.clearTimeout(id)
    }
  }, [game])

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
          Guess the five-letter word in six tries. Fewer guesses, faster solves, fewer hints. More points.
        </p>
        <p className="small">A perfect solve is 1,000 points. The timer starts the moment you press play.</p>
        <button className="btn btn-primary btn-big" disabled={busy} onClick={() => void api.start('daily')}>
          Play today’s Punto
        </button>
        <button className="btn btn-ghost" disabled={busy} onClick={() => void api.start('practice')}>
          Practice with a random word
        </button>
      </div>
    )
  }

  const done = game.status !== 'playing'
  const showSheet = done && !celebrating && !sheetDismissed
  const timer = fmtTimer(elapsedMs)
  const cfg = today.scoring

  // Live score: what you'd bank by solving with your NEXT guess, right now.
  // Mirrors the server model; the server remains the authority.
  const guessBonusNext = (today.maxGuesses - game.rows.length) * 100
  const poolNow = Math.max(0, cfg.timePool - Math.max(0, Math.floor(elapsedMs / 1000) - cfg.graceSec))
  const deductions = game.hints.length * cfg.hintPoints + (game.invalid ?? 0) * cfg.invalidPoints
  const liveScore = guessBonusNext + Math.max(0, poolNow - deductions)

  return (
    <div className="play">
      <div className="board-area">
        {mode === 'practice' && <span className="mode-pill">Practice · random word</span>}
        <Grid
          rows={game.rows}
          current={current}
          maxGuesses={today.maxGuesses}
          wordLength={today.wordLength}
          invalidShake={invalidShake}
          done={done}
          danceRow={celebrating === 'won' ? game.rows.length - 1 : null}
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
            className="stat-box hint-btn"
            disabled={busy || game.hints.length >= today.maxHints}
            title={`Hint · ${cfg.hintPoints} points / ${today.hintCostNim} NIM`}
            onClick={() => setConfirmHint(true)}
          >
            <span className="stat-caption">−{cfg.hintPoints} pts</span>
            <span className="stat-value hint-value">
              <span className="hint-dot" aria-hidden="true" />
              Hint
            </span>
          </button>
          <div className="stat-box stat-time" aria-label="Timer">
            <span className="stat-caption">
              <span className="timer-dot" aria-hidden="true" />
              Time
            </span>
            <span className="stat-value">{timer}</span>
          </div>
          <div className="stat-box" aria-label="Live score">
            <span className="stat-caption">Points</span>
            <span className="stat-value score-value">{liveScore.toLocaleString('en-US')}</span>
          </div>
        </div>
      )}

      <Keyboard keyStates={keyStates} onKey={api.pressKey} disabled={busy || done} />

      {celebrating === 'won' && (
        <div className="win-banner" role="status">
          Correct!
        </div>
      )}

      {done && sheetDismissed && !celebrating && (
        <div className="after-actions">
          <button className="btn btn-ghost" onClick={() => setSheetDismissed(false)}>
            Show result
          </button>
          <button className="btn btn-ghost" disabled={busy} onClick={() => void api.start('practice')}>
            {mode === 'practice' ? 'New practice word' : 'Practice round'}
          </button>
          {mode === 'practice' && (
            <button className="btn btn-ghost" onClick={() => api.switchMode('daily')}>
              Today’s Punto
            </button>
          )}
        </div>
      )}

      {confirmHint && !done && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Hint confirmation">
          <div className="modal">
            <h3 className="modal-title">Use a hint?</h3>
            <p className="muted">
              This hint costs <strong>{cfg.hintPoints} points</strong> and{' '}
              <strong>{today.hintCostNim} NIM</strong>. Solve clean instead?
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setConfirmHint(false)}>
                Solve clean
              </button>
              <button
                className="btn btn-primary"
                disabled={busy}
                onClick={() => {
                  setConfirmHint(false)
                  void api.requestHint()
                }}
              >
                Use hint
              </button>
            </div>
          </div>
        </div>
      )}

      {showSheet && (
        <ResultSheet
          game={game}
          streak={api.streak}
          onClose={() => setSheetDismissed(true)}
          onPractice={() => void api.start('practice')}
        />
      )}
    </div>
  )
}
