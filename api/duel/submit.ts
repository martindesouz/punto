import { getStore } from '../_lib/store'
import { validDevice, isExpired, sanitizeDuel } from '../_lib/duel'
import { verifyState } from '../_lib/token'
import { scoreGame } from '../_lib/game'
import { readJson, sendJson, methodNotAllowed, type Handler } from '../_lib/http'

interface Body {
  id?: string
  device?: string
  token?: string
}

// A player proves their result by submitting their finished daily-game
// token. It is HMAC-signed by this server, so the guesses, hints, invalid
// count, and timestamps inside are tamper-proof — the score is recomputed
// here, never trusted from the client.
const handler: Handler = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res)
  const body = await readJson<Body>(req)
  const device = validDevice(body?.device)
  const id = body?.id ?? ''
  if (!device || !/^[0-9a-f-]{10,64}$/i.test(id)) return sendJson(res, 400, { error: 'bad_request' })

  const store = getStore()
  const duel = await store.get(id)
  if (!duel) return sendJson(res, 404, { error: 'not_found' })
  if (duel.status === 'declined') return sendJson(res, 409, { error: 'declined' })
  if (duel.status === 'complete') return sendJson(res, 409, { error: 'already_complete' })
  if (isExpired(duel)) return sendJson(res, 409, { error: 'expired' })

  const role = duel.a.device === device ? 'a' : duel.b?.device === device ? 'b' : null
  if (!role) return sendJson(res, 403, { error: 'not_a_participant' })
  const player = role === 'a' ? duel.a : duel.b!
  if (player.submitted) return sendJson(res, 409, { error: 'already_submitted' })

  const state = body?.token ? verifyState(body.token) : null
  if (!state) return sendJson(res, 401, { error: 'bad_token' })
  if (!state.done) return sendJson(res, 409, { error: 'game_not_finished' })
  if (state.day !== duel.day) return sendJson(res, 409, { error: 'wrong_day' })

  const result = scoreGame(
    state.won,
    state.guesses.length,
    state.hints.length,
    state.invalid ?? 0,
    (state.end ?? state.start) - state.start,
  )
  player.submitted = true
  player.score = result.total
  player.breakdown = result
  player.submittedAt = Date.now()

  if (duel.a.submitted && duel.b?.submitted) {
    duel.status = 'complete'
    const sa = duel.a.score ?? 0
    const sb = duel.b.score ?? 0
    duel.winner = sa === sb ? 'tie' : sa > sb ? 'a' : 'b'
    if (duel.stake === 0 || duel.winner === 'tie') duel.settled = true // nothing to pay
  }
  await store.put(duel)
  sendJson(res, 200, { duel: sanitizeDuel(duel, device) })
}

export default handler
