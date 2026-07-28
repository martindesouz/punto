interface Props {
  streak: number
}

export function Header({ streak }: Props) {
  return (
    <header className="header">
      <div className="logo">
        <span className="logo-dot" aria-hidden="true" />
        punto
      </div>
      <div className="chips">
        <div className="chip" title="Daily streak">
          <span className="chip-drop" aria-hidden="true" />
          <span>{streak}</span>
        </div>
        <div className="chip chip-balance" title="NIM balance — arrives with wallet features">
          <svg className="chip-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 7.5A2.5 2.5 0 0 1 5.5 5h11A2.5 2.5 0 0 1 19 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 3 16.5v-9Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path d="M15 11h4a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-4a1.5 1.5 0 0 1 0-3Z" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <span>—</span>
        </div>
      </div>
    </header>
  )
}
