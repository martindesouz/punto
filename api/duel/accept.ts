import { getStore } from '../_lib/store'
import { normalizeAddress, validDevice, isExpired, sanitizeDuel } from '../_lib/duel'
import { readJson, sendJson, methodNotAllowed, type Handler } from '../_lib/http'

interface Body {
  id?: string
  device?: string
  address?: string
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

  const address = body?.address !== undefined ? normalizeAddress(body.address) : null
  if (duel.stake > 0 && !address) return sendJson(res, 400, { error: 'address_required' })

  duel.b = { device, address: address ?? undefined }
  duel.status = 'accepted'
  await store.put(duel)
  await store.linkDevice(device, duel.id)
  sendJson(res, 200, { duel: sanitizeDuel(duel, device) })
}

export default handler
