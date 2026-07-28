import { useNimiq } from '../nimiq/NimiqContext'

export function DuelScreen() {
  return (
    <div className="center-card">
      <span className="ph-icon" aria-hidden="true">⚔️</span>
      <h2>Duels</h2>
      <p className="muted">
        Challenge a friend to the same word, same seed. Winner takes the stake — settled peer to peer, no
        escrow, no rake.
      </p>
      <p className="muted small">Arriving in a later phase. Free duels first, NIM stakes after.</p>
    </div>
  )
}

export function RanksScreen() {
  return (
    <div className="center-card">
      <span className="ph-icon" aria-hidden="true">🏆</span>
      <h2>Ranks</h2>
      <p className="muted">The global daily leaderboard and streak table land here.</p>
      <p className="muted small">Coming with device identity — no signup, ever.</p>
    </div>
  )
}

export function WalletScreen() {
  const { status } = useNimiq()
  return (
    <div className="center-card">
      <span className="ph-icon" aria-hidden="true">👛</span>
      <h2>Wallet</h2>
      {status === 'ready' && <p className="wallet-status ok">● Connected to Nimiq Pay</p>}
      {status === 'connecting' && <p className="wallet-status">● Looking for Nimiq Pay…</p>}
      {status === 'unavailable' && (
        <>
          <p className="wallet-status off">● Not inside Nimiq Pay</p>
          <p className="muted small">
            Open Punto from the Mini Apps section of Nimiq Pay to unlock NIM hints and duels. The game is
            fully playable either way.
          </p>
        </>
      )}
      <p className="muted">
        1 point = 1 NIM. A hint costs 100 points and 100 NIM. Duel stakes are agreed between players and
        settled wallet-to-wallet — no custody, ever.
      </p>
    </div>
  )
}
