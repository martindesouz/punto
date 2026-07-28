import type { GameSnapshot } from './types'

const GAME_KEY = 'punto.game.v1'
const STREAK_KEY = 'punto.streak.v1'

interface StreakRecord {
  count: number
  lastWinDay: string
}

export function loadGame(): GameSnapshot | null {
  try {
    const raw = localStorage.getItem(GAME_KEY)
    return raw ? (JSON.parse(raw) as GameSnapshot) : null
  } catch {
    return null
  }
}

export function saveGame(snapshot: GameSnapshot): void {
  try {
    localStorage.setItem(GAME_KEY, JSON.stringify(snapshot))
  } catch {
    // storage full or blocked — the game still works, it just won't survive a reload
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(GAME_KEY)
  } catch {
    // ignore
  }
}

function prevDay(day: string): string {
  const t = Date.parse(`${day}T00:00:00Z`) - 86_400_000
  return new Date(t).toISOString().slice(0, 10)
}

// Local-only streak for phase 1; phase 3 moves this server-side with the
// device-identifier leaderboard.
export function getStreak(today: string): number {
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (!raw) return 0
    const rec = JSON.parse(raw) as StreakRecord
    return rec.lastWinDay === today || rec.lastWinDay === prevDay(today) ? rec.count : 0
  } catch {
    return 0
  }
}

export function recordWin(day: string): number {
  let count = 1
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (raw) {
      const rec = JSON.parse(raw) as StreakRecord
      if (rec.lastWinDay === day) return rec.count
      if (rec.lastWinDay === prevDay(day)) count = rec.count + 1
    }
    localStorage.setItem(STREAK_KEY, JSON.stringify({ count, lastWinDay: day } satisfies StreakRecord))
  } catch {
    // ignore
  }
  return count
}
