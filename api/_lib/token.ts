import { createHmac, timingSafeEqual } from 'node:crypto'

// All per-game state lives in an HMAC-signed token held by the client, so
// phase 1 needs no database and the client cannot tamper with guesses,
// hints, or the start time.
export interface GameState {
  v: 1
  day: string // UTC date, e.g. '2026-07-28'
  puzzle: number
  start: number // ms epoch, set server-side at /start
  guesses: string[]
  hints: number[] // revealed positions (0-4)
  invalid: number // rejected not-a-word submissions (penalized, not a guess)
  done: boolean
  won: boolean
  end?: number
}

function secret(): string {
  const s = process.env.PUNTO_SECRET
  if (s) return s
  if (process.env.VERCEL) throw new Error('PUNTO_SECRET is not set')
  return 'punto-dev-secret-do-not-use-in-prod'
}

function hmac(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export function signState(state: GameState): string {
  const payload = Buffer.from(JSON.stringify(state)).toString('base64url')
  return `${payload}.${hmac(payload)}`
}

export function verifyState(token: string): GameState | null {
  const dot = token.lastIndexOf('.')
  if (dot < 0) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = hmac(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const state = JSON.parse(Buffer.from(payload, 'base64url').toString()) as GameState
    if (state.v !== 1) return null
    return state
  } catch {
    return null
  }
}
