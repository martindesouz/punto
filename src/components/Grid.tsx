import type { CSSProperties } from 'react'
import type { Row } from '../game/types'

interface Props {
  rows: Row[]
  current: string
  maxGuesses: number
  wordLength: number
  invalidShake: boolean
  done: boolean
}

export function Grid({ rows, current, maxGuesses, wordLength, invalidShake, done }: Props) {
  const lines = []
  for (let r = 0; r < maxGuesses; r++) {
    const row = rows[r]
    const isCurrent = !done && r === rows.length
    const cells = []
    for (let i = 0; i < wordLength; i++) {
      const letter = row ? row.guess[i] : isCurrent ? (current[i] ?? '') : ''
      const state = row ? row.fb[i] : ''
      cells.push(
        <div
          key={i}
          className={`tile ${state} ${row ? 'reveal' : ''} ${letter && !row ? 'filled' : ''}`}
          style={row ? ({ '--d': `${i * 90}ms` } as CSSProperties) : undefined}
        >
          {letter}
        </div>,
      )
    }
    lines.push(
      <div key={r} className={`grid-row ${isCurrent && invalidShake ? 'shake' : ''}`} role="row">
        {cells}
      </div>,
    )
  }
  return (
    <div className="grid" role="grid" aria-label="Punto board">
      {lines}
    </div>
  )
}
