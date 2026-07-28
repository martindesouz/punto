import type { Feedback } from '../game/types'

interface Props {
  keyStates: Record<string, Feedback>
  onKey: (key: string) => void
  disabled: boolean
}

// iOS system-keyboard layout: three letter rows (middle row inset, third
// row with backspace on the right), and Enter on its own bottom row,
// directly below backspace.
export function Keyboard({ keyStates, onKey, disabled }: Props) {
  const letterKey = (ch: string) => (
    <button key={ch} className={`key ${keyStates[ch] ?? ''}`} disabled={disabled} onClick={() => onKey(ch)}>
      {ch}
    </button>
  )
  return (
    <div className="keyboard" aria-label="Keyboard">
      <div className="kb-row">{[...'qwertyuiop'].map(letterKey)}</div>
      <div className="kb-row kb-row-mid">{[...'asdfghjkl'].map(letterKey)}</div>
      <div className="kb-row">
        <span className="key-spacer" aria-hidden="true" />
        {[...'zxcvbnm'].map(letterKey)}
        <button className="key back" disabled={disabled} aria-label="Backspace" onClick={() => onKey('backspace')}>
          ⌫
        </button>
      </div>
      <div className="kb-row kb-row-last">
        <button className="key enter" disabled={disabled} onClick={() => onKey('enter')}>
          Enter
        </button>
      </div>
    </div>
  )
}
