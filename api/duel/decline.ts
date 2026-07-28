import { getStore } from '../_lib/store'
import { validDevice, isExpired, sanitizeDuel } from '../_lib/duel'
import { readJson, sendJson, methodNotAllowed, type Handler } from '../_lib/http'

interface Body {
  id?: string
  device?: string
}

const handler: Handler = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res)
  const body = await readJson<Body>(req)
  const device = validDevice(body?.device)
  const id = body?.id ?? ''
  if (!device || !/^[0-9a-f-]{10,64}$/i.test(id)) return sendJson(res, 400, { error: 'bad_request' })

  const store = getStore()
  const duel = await store.get(id)
  if (!duel) return sendJson(res, 404, { error: 'not_found' })
  if (isExpired(duel)) return sendJson(res, 409, { error: 'expired' })
  if (duel.status !== 'open') return sendJson(res, 409, { error: 'not_open', status: duel.status })
  if (duel.a.device === device) return sendJson(res, 409, { error: 'own_challenge' })

  duel.status = 'declined'
  await store.put(duel)
  sendJson(res, 200, { duel: sanitizeDuel(duel, device) })
}

export default handler
