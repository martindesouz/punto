import { getStore } from '../_lib/store'
import { validDevice, sanitizeDuel } from '../_lib/duel'
import { readJson, sendJson, methodNotAllowed, type Handler } from '../_lib/http'

interface Body {
  id?: string
  device?: string
  txHash?: string
}

// Honor-based settlement: the loser reports that they paid. The platform
// never holds or moves funds — this only clears the unsettled-duel flag.
const handler: Handler = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res)
  const body = await readJson<Body>(req)
  const device = validDevice(body?.device)
  const id = body?.id ?? ''
  if (!device || !/^[0-9a-f-]{10,64}$/i.test(id)) return sendJson(res, 400, { error: 'bad_request' })

  const store = getStore()
  const duel = await store.get(id)
  if (!duel) return sendJson(res, 404, { error: 'not_found' })
  if (duel.status !== 'complete' || !duel.winner || duel.winner === 'tie' || duel.stake === 0) {
    return sendJson(res, 409, { error: 'nothing_to_settle' })
  }
  const loser = duel.winner === 'a' ? duel.b : duel.a
  if (loser?.device !== device) return sendJson(res, 403, { error: 'not_the_loser' })
  if (duel.settled) return sendJson(res, 409, { error: 'already_settled' })

  duel.settled = true
  duel.settledAt = Date.now()
  await store.put(duel)
  sendJson(res, 200, { duel: sanitizeDuel(duel, device) })
}

export default handler
