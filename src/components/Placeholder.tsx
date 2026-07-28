import { useNimiq } from '../nimiq/NimiqContext'

export function RanksScreen() {
  return (
    <div className="center-card">
      <span className="ph-icon" aria-hidden="true">🏆</span>
      <h2>Ranks</h2>
      <p className="muted">The global daily leaderboard and streak table land here.</p>
      <p className="muted small">Coming with device identity. No signup, ever.</p>
    </div>
  )
}

export function WalletScreen({ unsettled }: { unsettled: number }) {
  const { status } = useNimiq()
  return (
    <div className="center-card">
      <span className="ph-icon" aria-hidden="true">👛</span>
      <h2>Wallet</h2>
      {unsettled > 0 && (
        <div className="warn-banner" role="alert">
          ⚠️ {unsettled} unsettled duel{unsettled > 1 ? 's' : ''} on this device. Settle from the Duel tab to
          clear this flag.
        </div>
      )}
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
        1 point = 1 NIM. A hint costs 100 points and 100 NIM. Duel stakes are agreed between players, in NIM
        or USDC, and settled wallet-to-wallet. No custody, ever.
      </p>
    </div>
  )
}
