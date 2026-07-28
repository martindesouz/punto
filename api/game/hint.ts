import { dailyWord, todayUTC, MAX_HINTS } from '../_lib/game'
import { signState, verifyState } from '../_lib/token'
import { readJson, sendJson, methodNotAllowed, type Handler } from '../_lib/http'

interface Body {
  token?: string
}

// Reveals one letter of the answer at a position the player hasn't solved
// yet. Free in phase 1; phase 2 gates this behind a 5 NIM payment.
const handler: Handler = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res)
  const body = await readJson<Body>(req)
  const state = body?.token ? verifyState(body.token) : null
  if (!state) return sendJson(res, 401, { error: 'bad_token' })

  const { day } = todayUTC()
  if (state.day !== day) return sendJson(res, 409, { error: 'expired', day })
  if (state.done) return sendJson(res, 409, { error: 'already_done' })
  if (state.hints.length >= MAX_HINTS) return sendJson(res, 409, { error: 'no_hints_left' })

  const answer = dailyWord(state.day)

  // Positions already solved via a correct (green) placement in any guess.
  const solved = new Set<number>(state.hints)
  for (const g of state.guesses) {
    for (let i = 0; i < answer.length; i++) {
      if (g[i] === answer[i]) solved.add(i)
    }
  }
  const candidates = [...Array(answer.length).keys()].filter(i => !solved.has(i))
  if (candidates.length === 0) return sendJson(res, 409, { error: 'nothing_to_reveal' })

  // Deterministic pick so replaying the request can't farm different letters.
  const pos = candidates[state.hints.length % candidates.length]
  state.hints.push(pos)

  sendJson(res, 200, {
    token: signState(state),
    hint: { pos, letter: answer[pos] },
    hintsUsed: state.hints.length,
    hintsLeft: MAX_HINTS - state.hints.length,
  })
}

export default handler
