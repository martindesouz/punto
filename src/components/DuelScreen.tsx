import { useState } from 'react'
import type { DuelsApi } from '../duel/useDuels'
import { iLost, iWon, myRole, type DuelView, type StakeCurrency } from '../duel/types'

interface Props {
  duels: DuelsApi
  playedToday: boolean
  onGoPlay: () => void
}

function fmtStake(duel: Pick<DuelView, 'stake' | 'currency'>): string {
  return duel.stake > 0 ? `${duel.stake.toLocaleString('en-US')} ${duel.currency}` : 'Free · bragging rights'
}

function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => false,
    )
  }
  return Promise.resolve(false)
}

function DuelCard({ duel, duels, onGoPlay }: { duel: DuelView; duels: DuelsApi; onGoPlay: () => void }) {
  const [showSettle, setShowSettle] = useState(false)
  const [copied, setCopied] = useState(false)
  const role = myRole(duel)
  const mine = role === 'a' ? duel.a : role === 'b' ? duel.b : null
  const links = duels.buildLinks(duel.id)

  let statusLine: string
  if (duel.status === 'declined') statusLine = 'Challenge declined'
  else if (duel.status === 'expired') statusLine = 'Expired. Duels last one day.'
  else if (duel.status === 'open') statusLine = role === 'a' ? 'Waiting for someone to accept…' : 'Open challenge'
  else if (duel.status === 'accepted') {
    statusLine = mine && !mine.submitted ? 'Your move! Play today’s Punto.' : 'Waiting for your opponent to finish…'
  } else if (duel.winner === 'tie') statusLine = `It’s a tie! ${duel.a.score} points each`
  else if (iWon(duel)) statusLine = `You won ${duel.a.isYou ? duel.a.score : duel.b.score} to ${duel.a.isYou ? duel.b.score : duel.a.score}!`
  else statusLine = `You lost ${duel.a.isYou ? duel.a.score : duel.b.score} to ${duel.a.isYou ? duel.b.score : duel.a.score}`

  const lostStaked = iLost(duel) && duel.stake > 0
  const wonStaked = iWon(duel) && duel.stake > 0

  return (
    <div className="duel-card">
      <div className="duel-card-head">
        <span className="duel-stake">{fmtStake(duel)}</span>
        <span className="duel-day">#{duel.puzzle}</span>
      </div>
      <p className="duel-status">{statusLine}</p>

      {duel.status === 'open' && role === 'a' && (
        <div className="duel-actions">
          <button
            className="btn btn-small"
            onClick={() => {
              void copyText(links.deeplink).then(ok => {
                setCopied(ok)
                window.setTimeout(() => setCopied(false), 1500)
              })
            }}
          >
            {copied ? 'Copied!' : 'Copy challenge link'}
          </button>
        </div>
      )}

      {duel.status === 'accepted' && mine && !mine.submitted && (
        <div className="duel-actions">
          <button className="btn btn-primary btn-small" onClick={onGoPlay}>
            Play now
          </button>
        </div>
      )}

      {wonStaked && !duel.settled && <p className="small">Awaiting your opponent’s {fmtStake(duel)}. Settled wallet-to-wallet.</p>}
      {wonStaked && duel.settled && <p className="small ok-note">✓ Settled</p>}

      {lostStaked && !duel.settled && (
        <div className="duel-actions">
          <button className="btn btn-primary btn-small" onClick={() => setShowSettle(true)}>
            Settle {fmtStake(duel)}
          </button>
        </div>
      )}
      {lostStaked && duel.settled && <p className="small ok-note">✓ Settled. Good game.</p>}

      {showSettle && duel.winnerAddress && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Settle duel">
          <div className="modal">
            <h3 className="modal-title">Settle your duel</h3>
            <p className="muted">
              You lost this one. Send <strong>{fmtStake(duel)}</strong>
              {duel.currency === 'USDC' ? ' (on Base)' : ''} directly to the winner. Punto never touches the
              funds.
            </p>
            <p className="address-box">{duel.winnerAddress}</p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowSettle(false)}>
                Later
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  void duels.settle(duel).then(outcome => {
                    if (outcome !== 'cancelled') setShowSettle(false)
                  })
                }}
              >
                Pay now
              </button>
            </div>
            <p className="small">Skipping leaves an unsettled-duel flag on your profile.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function DuelScreen({ duels, playedToday, onGoPlay }: Props) {
  const [stakeInput, setStakeInput] = useState('')
  const [currency, setCurrency] = useState<StakeCurrency>('NIM')
  const [created, setCreated] = useState<DuelView | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const incoming = duels.incoming
  const incomingIsForeign = incoming && !incoming.a.isYou && !incoming.b.isYou && incoming.status === 'open'

  const doCopy = (key: string, text: string) => {
    void copyText(text).then(ok => {
      setCopied(ok ? key : null)
      window.setTimeout(() => setCopied(null), 1500)
    })
  }

  const createdLinks = created ? duels.buildLinks(created.id) : null

  return (
    <div className="duel-screen">
      {duels.unsettled > 0 && (
        <div className="warn-banner" role="alert">
          ⚠️ {duels.unsettled} unsettled duel{duels.unsettled > 1 ? 's' : ''} on this device. Settle below to
          clear it.
        </div>
      )}

      {incomingIsForeign && (
        <div className="duel-card challenge-card">
          <h3 className="modal-title">You’ve been challenged! ⚔️</h3>
          <p className="muted">
            Punto #{incoming.puzzle} · Stake: <strong>{fmtStake(incoming)}</strong>
          </p>
          <p className="small">
            Same word, same day, head to head.{' '}
            {incoming.stake > 0 ? 'Loser pays the winner directly. No escrow.' : ''}
          </p>
          <div className="modal-actions">
            <button className="btn" disabled={duels.busy} onClick={() => void duels.decline(incoming.id).then(() => duels.clearIncoming())}>
              Decline
            </button>
            <button
              className="btn btn-primary"
              disabled={duels.busy}
              onClick={() =>
                void duels.accept(incoming.id).then(ok => {
                  if (ok && !playedToday) onGoPlay()
                })
              }
            >
              Accept duel
            </button>
          </div>
        </div>
      )}

      {created && createdLinks ? (
        <div className="duel-card challenge-card">
          <h3 className="modal-title">Challenge created</h3>
          <p className="muted">
            Stake: <strong>{fmtStake(created)}</strong>. Send this link to your rival. It opens Punto inside
            Nimiq Pay:
          </p>
          <p className="address-box">{createdLinks.deeplink}</p>
          <div className="modal-actions">
            <button className="btn" onClick={() => doCopy('deeplink', createdLinks.deeplink)}>
              {copied === 'deeplink' ? 'Copied!' : 'Copy link'}
            </button>
            {'share' in navigator && typeof navigator.share === 'function' ? (
              <button
                className="btn btn-primary"
                onClick={() => void navigator.share({ title: 'Punto duel', text: 'Duel me in Punto!', url: createdLinks.appUrl }).catch(() => undefined)}
              >
                Share…
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => doCopy('app', createdLinks.appUrl)}>
                {copied === 'app' ? 'Copied!' : 'Copy web link'}
              </button>
            )}
          </div>
          <p className="small">
            {playedToday ? 'Your score is locked in the moment they accept.' : 'Play today’s Punto to lock in your score.'}
          </p>
          <button className="btn btn-ghost btn-small" onClick={() => setCreated(null)}>
            Done
          </button>
        </div>
      ) : (
        <div className="duel-card">
          <h3 className="duel-heading">Challenge a friend</h3>
          <p className="small">
            Same daily word, same seed, head to head. Winner takes the stake, or duel free for bragging
            rights.
          </p>
          <div className="stake-row">
            <input
              className="stake-input"
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="0"
              value={stakeInput}
              onChange={e => setStakeInput(e.target.value)}
              aria-label={`Stake in ${currency}`}
            />
            <div className="currency-toggle" role="radiogroup" aria-label="Stake currency">
              {(['NIM', 'USDC'] as const).map(c => (
                <button
                  key={c}
                  role="radio"
                  aria-checked={currency === c}
                  className={`currency-option ${currency === c ? 'active' : ''}`}
                  onClick={() => setCurrency(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <p className="small">0 = free duel. USDC stakes settle on Base.</p>
          <button
            className="btn btn-primary"
            disabled={duels.busy || !duels.deviceId}
            onClick={() => {
              const stake = Math.max(0, Number.parseFloat(stakeInput || '0') || 0)
              void duels.create(stake, currency).then(d => {
                if (d) setCreated(d)
              })
            }}
          >
            Create challenge
          </button>
        </div>
      )}

      {duels.duels.length > 0 && (
        <div className="duel-list">
          <h3 className="duel-heading">Your duels</h3>
          {duels.duels.map(d => (
            <DuelCard key={d.id} duel={d} duels={duels} onGoPlay={onGoPlay} />
          ))}
        </div>
      )}
    </div>
  )
}
