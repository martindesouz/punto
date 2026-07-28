import { createHmac } from 'node:crypto'
import { ANSWERS } from './answers'
import { ALLOWED_WORDS } from './allowed-words'

export const WORD_LENGTH = 5
export const MAX_GUESSES = 6
export const MAX_HINTS = 3

// Scoring model. 1 point = 1 NIM is the pricing anchor.
export const TIME_POOL = 400
export const GRACE_SEC = 20
export const HINT_POINTS = 100
export const INVALID_POINTS = 15
export const HINT_COST_NIM = HINT_POINTS

// Puzzle #1 was July 28, 2026 (UTC). Same clock for every player worldwide
// so duel seeds stay fair.
const EPOCH_UTC = Date.UTC(2026, 6, 28)

export type Feedback = 'c' | 'p' | 'a' // correct / present / absent

export function todayUTC(now = Date.now()): { day: string; puzzle: number } {
  const d = new Date(now)
  const day = d.toISOString().slice(0, 10)
  const puzzle = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - EPOCH_UTC) / 86_400_000) + 1
  return { day, puzzle }
}

// Deterministic but unpredictable daily pick: HMAC(secret, day) -> index.
export function dailyWord(day: string): string {
  const secret = process.env.PUNTO_SECRET ?? 'punto-dev-secret-do-not-use-in-prod'
  const digest = createHmac('sha256', secret).update(`daily:${day}`).digest()
  const idx = digest.readUInt32BE(0) % ANSWERS.length
  return ANSWERS[idx]
}

export function isAllowedGuess(guess: string): boolean {
  return ALLOWED_WORDS.has(guess) || ANSWERS.includes(guess)
}

// Standard Wordle feedback with correct duplicate-letter handling:
// exact matches consume letters first, then presents left to right.
export function feedbackFor(answer: string, guess: string): Feedback[] {
  const fb: Feedback[] = new Array(WORD_LENGTH).fill('a')
  const remaining: Record<string, number> = {}
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) fb[i] = 'c'
    else remaining[answer[i]] = (remaining[answer[i]] ?? 0) + 1
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (fb[i] === 'c') continue
    const ch = guess[i]
    if (remaining[ch] > 0) {
      fb[i] = 'p'
      remaining[ch]--
    }
  }
  return fb
}

export interface ScoreBreakdown {
  guessesUsed: number
  hintsUsed: number
  invalidWords: number
  elapsedSec: number
  guessBonus: number
  timePool: number
  hintDeduction: number
  invalidDeduction: number
  timePoints: number
  total: number
}

export function timePoolAt(elapsedSec: number): number {
  return Math.max(0, TIME_POOL - Math.max(0, elapsedSec - GRACE_SEC))
}

// Two-part score:
//   guessBonus — guaranteed on solve, never eroded: (7 - guesses) * 100.
//   timePoints — the time pool (full for GRACE_SEC, then -1/s) minus hint
//   and invalid-word deductions, floored at zero.
// Perfect 1000 = guess 1, no hints, solved within the grace period.
export function scoreGame(
  won: boolean,
  guessesUsed: number,
  hintsUsed: number,
  invalidWords: number,
  elapsedMs: number,
): ScoreBreakdown {
  const elapsedSec = Math.max(0, Math.floor(elapsedMs / 1000))
  const base = { guessesUsed, hintsUsed, invalidWords, elapsedSec }
  if (!won) {
    return { ...base, guessBonus: 0, timePool: 0, hintDeduction: 0, invalidDeduction: 0, timePoints: 0, total: 0 }
  }
  const guessBonus = (MAX_GUESSES + 1 - guessesUsed) * 100 // 600..100
  const timePool = timePoolAt(elapsedSec)
  const hintDeduction = hintsUsed * HINT_POINTS
  const invalidDeduction = invalidWords * INVALID_POINTS
  const timePoints = Math.max(0, timePool - hintDeduction - invalidDeduction)
  return { ...base, guessBonus, timePool, hintDeduction, invalidDeduction, timePoints, total: guessBonus + timePoints }
}
