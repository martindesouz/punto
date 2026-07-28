import { todayUTC } from '../_lib/game'
import { signState, type GameState } from '../_lib/token'
import { sendJson, methodNotAllowed, type Handler } from '../_lib/http'

const handler: Handler = (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res)
  const { day, puzzle } = todayUTC()
  const state: GameState = {
    v: 1,
    day,
    puzzle,
    start: Date.now(), // timer starts the moment you begin — server clock
    guesses: [],
    hints: [],
    done: false,
    won: false,
  }
  sendJson(res, 200, { token: signState(state), day, puzzle, startedAt: state.start })
}

export default handler
