import { createHmac } from 'node:crypto'
import { ANSWERS } from './answers'
import { ALLOWED_WORDS } from './allowed-words'

export const WORD_LENGTH = 5
export const MAX_GUESSES = 6
export const MAX_HINTS = 3
export const HINT_COST_NIM = 5

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
  elapsedSec: number
  guessPoints: number
  timeBonus: number
  hintPenalty: number
  noHintBonus: number
  total: number
}

// Points per PRD: fewest guesses, shortest solve time, fewest hints,
// +1 bonus for a hint-free solve. A loss scores zero.
export function scoreGame(won: boolean, guessesUsed: number, hintsUsed: number, elapsedMs: number): ScoreBreakdown {
  const elapsedSec = Math.max(0, Math.round(elapsedMs / 1000))
  if (!won) {
    return { guessesUsed, hintsUsed, elapsedSec, guessPoints: 0, timeBonus: 0, hintPenalty: 0, noHintBonus: 0, total: 0 }
  }
  const guessPoints = (MAX_GUESSES + 1 - guessesUsed) * 10 // 10..60
  const timeBonus = Math.max(0, 30 - Math.floor(elapsedSec / 10)) // full 30 under 10s, fades to 0 at 5min
  const hintPenalty = hintsUsed * 5
  const noHintBonus = hintsUsed === 0 ? 1 : 0
  const total = Math.max(0, guessPoints + timeBonus - hintPenalty + noHintBonus)
  return { guessesUsed, hintsUsed, elapsedSec, guessPoints, timeBonus, hintPenalty, noHintBonus, total }
}
