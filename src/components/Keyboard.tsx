import type { Feedback } from '../game/types'

const ROWS = ['qwertyuiop', 'asdfghjkl', '\nzxcvbnm\b'] as const

interface Props {
  keyStates: Record<string, Feedback>
  onKey: (key: string) => void
  disabled: boolean
}

export function Keyboard({ keyStates, onKey, disabled }: Props) {
  return (
    <div className="keyboard" aria-label="Keyboard">
      {ROWS.map((row, i) => (
        <div key={i} className="kb-row">
          {[...row].map(ch => {
            if (ch === '\n') {
              return (
                <button key="enter" className="key wide" disabled={disabled} onClick={() => onKey('enter')}>
                  Enter
                </button>
              )
            }
            if (ch === '\b') {
              return (
                <button
                  key="backspace"
                  className="key wide"
                  disabled={disabled}
                  aria-label="Backspace"
                  onClick={() => onKey('backspace')}
                >
                  ⌫
                </button>
              )
            }
            return (
              <button
                key={ch}
                className={`key ${keyStates[ch] ?? ''}`}
                disabled={disabled}
                onClick={() => onKey(ch)}
              >
                {ch}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
