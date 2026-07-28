import { todayUTC, WORD_LENGTH, MAX_GUESSES, MAX_HINTS, HINT_COST_NIM } from '../_lib/game'
import { sendJson, type Handler } from '../_lib/http'

const handler: Handler = (_req, res) => {
  const { day, puzzle } = todayUTC()
  sendJson(res, 200, {
    day,
    puzzle,
    wordLength: WORD_LENGTH,
    maxGuesses: MAX_GUESSES,
    maxHints: MAX_HINTS,
    hintCostNim: HINT_COST_NIM,
    serverNow: Date.now(),
  })
}

export default handler
