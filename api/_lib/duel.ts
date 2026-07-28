import { todayUTC } from './game'
import type { Duel, DuelPlayer } from './store'

// Nimiq address: NQ + 2 check digits + 32 base32 chars (spaces optional).
export function normalizeAddress(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const compact = raw.toUpperCase().replace(/\s+/g, '')
  if (!/^NQ\d{2}[0-9A-Z]{32}$/.test(compact)) return null
  // Re-group in blocks of 4 for display.
  return compact.replace(/(.{4})(?=.)/g, '$1 ')
}

export function validDevice(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const d = raw.trim()
  return /^[0-9a-f-]{16,64}$/i.test(d) ? d : null
}

export function validStake(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : NaN
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000_000) return null
  return Math.round(n * 1e5) / 1e5 // NIM with Luna precision
}

export function isExpired(duel: Duel): boolean {
  return duel.status !== 'complete' && duel.status !== 'declined' && duel.day !== todayUTC().day
}

interface PlayerView {
  joined: boolean
  submitted: boolean
  isYou: boolean
  score?: number
}

function playerView(p: DuelPlayer | undefined, device: string | null, complete: boolean): PlayerView {
  if (!p) return { joined: false, submitted: false, isYou: false }
  return {
    joined: true,
    submitted: !!p.submitted,
    isYou: device !== null && p.device === device,
    // Scores stay hidden until both are in, so the second player can't
    // see the target to beat.
    score: complete ? p.score : undefined,
  }
}

// Public shape sent to clients: no device ids, no addresses until a staked
// duel completes (the loser needs the winner's address to settle).
export function sanitizeDuel(duel: Duel, device: string | null) {
  const expired = isExpired(duel)
  const complete = duel.status === 'complete'
  const winnerPlayer = duel.winner === 'a' ? duel.a : duel.winner === 'b' ? duel.b : undefined
  return {
    id: duel.id,
    day: duel.day,
    puzzle: duel.puzzle,
    stake: duel.stake,
    status: expired ? ('expired' as const) : duel.status,
    createdAt: duel.createdAt,
    a: playerView(duel.a, device, complete),
    b: playerView(duel.b, device, complete),
    winner: complete ? duel.winner : undefined,
    winnerAddress: complete && duel.stake > 0 && duel.winner !== 'tie' ? winnerPlayer?.address : undefined,
    settled: duel.settled ?? false,
  }
}

export type SanitizedDuel = ReturnType<typeof sanitizeDuel>
