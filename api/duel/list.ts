import { getStore } from '../_lib/store'
import { sanitizeDuel, validDevice } from '../_lib/duel'
import { sendJson, type Handler } from '../_lib/http'

const handler: Handler = async (req, res) => {
  const url = new URL(req.url ?? '', 'http://localhost')
  const device = validDevice(url.searchParams.get('device'))
  if (!device) return sendJson(res, 400, { error: 'bad_request' })

  const store = getStore()
  const ids = await store.idsByDevice(device)
  const duels = []
  for (const id of ids) {
    const d = await store.get(id)
    if (d) duels.push(sanitizeDuel(d, device))
  }
  duels.sort((x, y) => y.createdAt - x.createdAt)

  // The unsettled-duel flag: staked duels this device lost and never paid.
  const unsettled = duels.filter(d => {
    if (d.status !== 'complete' || d.stake === 0 || d.settled || !d.winner || d.winner === 'tie') return false
    const loser = d.winner === 'a' ? d.b : d.a
    return loser.isYou
  }).length

  sendJson(res, 200, { duels, unsettled })
}

export default handler
