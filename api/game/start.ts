import { randomUUID } from 'node:crypto'
import { todayUTC } from '../_lib/game'
import { signState, type GameState } from '../_lib/token'
import { readJson, sendJson, methodNotAllowed, type Handler } from '../_lib/http'

interface Body {
  mode?: string
}

const handler: Handler = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res)
  const body = await readJson<Body>(req)
  const { day, puzzle } = todayUTC()

  // Practice mode: a random word every round, scored like the daily but
  // excluded from streaks and duels (its "day" never matches a duel day).
  const practice = body?.mode === 'practice'
  const gameDay = practice ? `practice:${randomUUID()}` : day

  const state: GameState = {
    v: 1,
    day: gameDay,
    puzzle: practice ? 0 : puzzle,
    start: Date.now(), // timer starts the moment you begin, server clock
    guesses: [],
    hints: [],
    invalid: 0,
    done: false,
    won: false,
  }
  sendJson(res, 200, { token: signState(state), day: gameDay, puzzle: state.puzzle, startedAt: state.start, practice })
}

export default handler
