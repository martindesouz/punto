export interface DuelPlayerView {
  joined: boolean
  submitted: boolean
  isYou: boolean
  score?: number
}

export type DuelStatus = 'open' | 'accepted' | 'declined' | 'complete' | 'expired'

export type StakeCurrency = 'NIM' | 'USDC'

export interface DuelView {
  id: string
  day: string
  puzzle: number
  stake: number
  currency: StakeCurrency
  status: DuelStatus
  createdAt: number
  a: DuelPlayerView
  b: DuelPlayerView
  winner?: 'a' | 'b' | 'tie'
  winnerAddress?: string
  settled: boolean
}

export function myRole(d: DuelView): 'a' | 'b' | null {
  if (d.a.isYou) return 'a'
  if (d.b.isYou) return 'b'
  return null
}

export function iWon(d: DuelView): boolean {
  const role = myRole(d)
  return d.status === 'complete' && role !== null && d.winner === role
}

export function iLost(d: DuelView): boolean {
  const role = myRole(d)
  return d.status === 'complete' && role !== null && d.winner !== 'tie' && d.winner !== undefined && d.winner !== role
}
