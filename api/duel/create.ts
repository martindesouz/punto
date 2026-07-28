import { randomUUID } from 'node:crypto'
import { todayUTC } from '../_lib/game'
import { getStore, type Duel } from '../_lib/store'
import { normalizeAddress, validDevice, validStake, sanitizeDuel } from '../_lib/duel'
import { readJson, sendJson, methodNotAllowed, type Handler } from '../_lib/http'

interface Body {
  device?: string
  stake?: number
  address?: string
}

const handler: Handler = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res)
  const body = await readJson<Body>(req)
  const device = validDevice(body?.device)
  const stake = validStake(body?.stake)
  if (!device || stake === null) return sendJson(res, 400, { error: 'bad_request' })

  // A staked duel needs the creator's payout address up front, so the
  // opponent can settle even if the creator never reopens the app.
  const address = body?.address !== undefined ? normalizeAddress(body.address) : null
  if (stake > 0 && !address) return sendJson(res, 400, { error: 'address_required' })

  const { day, puzzle } = todayUTC()
  const duel: Duel = {
    id: randomUUID(),
    day,
    puzzle,
    stake,
    status: 'open',
    createdAt: Date.now(),
    a: { device, address: address ?? undefined },
  }
  const store = getStore()
  await store.put(duel)
  await store.linkDevice(device, duel.id)
  sendJson(res, 200, { duel: sanitizeDuel(duel, device) })
}

export default handler
