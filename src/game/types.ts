export type Feedback = 'c' | 'p' | 'a' // correct / present / absent

export interface Row {
  guess: string
  fb: Feedback[]
}

export interface Hint {
  pos: number
  letter: string
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

export interface ScoringConfig {
  timePool: number
  graceSec: number
  hintPoints: number
  invalidPoints: number
}

export type GameStatus = 'playing' | 'won' | 'lost'

export interface GameSnapshot {
  day: string
  puzzle: number
  token: string
  rows: Row[]
  hints: Hint[]
  invalid: number
  status: GameStatus
  startedAt: number
  endedAt?: number
  result?: ScoreBreakdown
  answer?: string
}

export interface TodayInfo {
  day: string
  puzzle: number
  wordLength: number
  maxGuesses: number
  maxHints: number
  hintCostNim: number
  scoring: ScoringConfig
  serverNow: number
}
