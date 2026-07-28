import { getStore } from '../_lib/store'
import { sanitizeDuel } from '../_lib/duel'
import { sendJson, type Handler } from '../_lib/http'

const handler: Handler = async (req, res) => {
  const url = new URL(req.url ?? '', 'http://localhost')
  const id = url.searchParams.get('id') ?? ''
  const device = url.searchParams.get('device')
  if (!/^[0-9a-f-]{10,64}$/i.test(id)) return sendJson(res, 400, { error: 'bad_request' })
  const duel = await getStore().get(id)
  if (!duel) return sendJson(res, 404, { error: 'not_found' })
  sendJson(res, 200, { duel: sanitizeDuel(duel, device) })
}

export default handler
