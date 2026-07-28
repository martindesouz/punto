import type { Feedback } from '../game/types'

interface Props {
  keyStates: Record<string, Feedback>
  onKey: (key: string) => void
  disabled: boolean
}

// Three balanced rows that fill the full width: backspace closes the
// A-row beside L, Enter closes the bottom row beside M.
export function Keyboard({ keyStates, onKey, disabled }: Props) {
  const letterKey = (ch: string) => (
    <button key={ch} className={`key ${keyStates[ch] ?? ''}`} disabled={disabled} onClick={() => onKey(ch)}>
      {ch}
    </button>
  )
  return (
    <div className="keyboard" aria-label="Keyboard">
      <div className="kb-row">{[...'qwertyuiop'].map(letterKey)}</div>
      <div className="kb-row">
        {[...'asdfghjkl'].map(letterKey)}
        <button className="key back" disabled={disabled} aria-label="Backspace" onClick={() => onKey('backspace')}>
          ⌫
        </button>
      </div>
      <div className="kb-row">
        {[...'zxcvbnm'].map(letterKey)}
        <button className="key enter" disabled={disabled} onClick={() => onKey('enter')}>
          Enter
        </button>
      </div>
    </div>
  )
}
