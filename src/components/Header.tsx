interface Props {
  streak: number
}

// Placeholder balance so the chip reads correctly; phase 2 replaces this
// with the real NIM balance from the wallet.
const TEST_BALANCE_NIM = 1240

export function Header({ streak }: Props) {
  return (
    <header className="header">
      <div className="logo">
        <span className="logo-dot" aria-hidden="true" />
        punto
      </div>
      <div className="chips">
        <div className="chip" title="Daily streak">
          <svg className="chip-icon chip-flame" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2c1.6 3.6 5 5.8 5 10a5 5 0 0 1-10 0c0-1.9.7-3.4 1.7-4.8.5 1.1 1.2 1.9 2.2 2.4C10.6 7.2 11.2 4.5 12 2Z"
              fill="currentColor"
            />
          </svg>
          <span className="chip-num">{streak}</span>
        </div>
        <div className="chip" title="NIM balance (test value until wallet connects)">
          <svg className="chip-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 7.5A2.5 2.5 0 0 1 5.5 5h11A2.5 2.5 0 0 1 19 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 3 16.5v-9Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M15 10.75h5.5v2.5H15a1.25 1.25 0 0 1 0-2.5Z" fill="currentColor" />
          </svg>
          <span className="chip-num chip-gold">{TEST_BALANCE_NIM.toLocaleString('en-US')}</span>
          <span className="chip-unit">NIM</span>
        </div>
      </div>
    </header>
  )
}
