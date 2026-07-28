import { useEffect, useState } from 'react'
import type { GameSnapshot } from '../game/types'

interface Props {
  game: GameSnapshot
  streak: number
  onClose: () => void
}

function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function nextPuzzleCountdown(): string {
  const now = new Date()
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  const left = Math.max(0, Math.floor((next - now.getTime()) / 1000))
  const h = Math.floor(left / 3600)
  const m = Math.floor((left % 3600) / 60)
  const s = left % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function ResultSheet({ game, streak, onClose }: Props) {
  const [countdown, setCountdown] = useState(nextPuzzleCountdown())
  useEffect(() => {
    const id = window.setInterval(() => setCountdown(nextPuzzleCountdown()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const won = game.status === 'won'
  const r = game.result

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="Result">
      <div className="sheet">
        <h2 className={won ? 'result-title won' : 'result-title'}>
          {won ? 'Solved!' : 'Out of guesses'}
        </h2>
        {!won && game.answer && (
          <p className="answer-reveal">
            The word was <strong>{game.answer.toUpperCase()}</strong>
          </p>
        )}
        {r && (
          <div className="score-table">
            <div className="score-line">
              <span>Guesses · {r.guessesUsed}/6</span>
              <span className="pts">+{r.guessPoints}</span>
            </div>
            <div className="score-line">
              <span>Time · {fmtClock(r.elapsedSec)}</span>
              <span className="pts">+{r.timeBonus}</span>
            </div>
            <div className="score-line">
              <span>Hints · {r.hintsUsed}</span>
              <span className="pts">{r.hintPenalty > 0 ? `−${r.hintPenalty}` : '−0'}</span>
            </div>
            {r.noHintBonus > 0 && (
              <div className="score-line bonus">
                <span>No-hint bonus</span>
                <span className="pts">+{r.noHintBonus}</span>
              </div>
            )}
            <div className="score-line total">
              <span>Points</span>
              <span className="pts">{r.total}</span>
            </div>
          </div>
        )}
        {won && (
          <p className="streak-note">
            🔥 Streak: <strong>{streak}</strong>
          </p>
        )}
        <p className="countdown">
          Next Punto in <strong>{countdown}</strong>
        </p>
        <button className="btn btn-primary" onClick={onClose}>
          Back to the board
        </button>
      </div>
    </div>
  )
}
