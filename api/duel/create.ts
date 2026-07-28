import { randomUUID } from 'node:crypto'
import { todayUTC } from '../_lib/game'
import { getStore, type Duel } from '../_lib/store'
import { normalizeAddress, validCurrency, validDevice, validStake, sanitizeDuel } from '../_lib/duel'
import { readJson, sendJson, methodNotAllowed, type Handler } from '../_lib/http'

interface Body {
  device?: string
  stake?: number
  currency?: string
  address?: string
}

const handler: Handler = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res)
  const body = await readJson<Body>(req)
  const device = validDevice(body?.device)
  const stake = validStake(body?.stake)
  const currency = validCurrency(body?.currency ?? 'NIM')
  if (!device || stake === null || !currency) return sendJson(res, 400, { error: 'bad_request' })

  // A staked duel needs the creator's payout address up front, so the
  // opponent can settle even if the creator never reopens the app.
  const address = body?.address !== undefined ? normalizeAddress(body.address, currency) : null
  if (stake > 0 && !address) return sendJson(res, 400, { error: 'address_required' })

  const { day, puzzle } = todayUTC()
  const duel: Duel = {
    id: randomUUID(),
    day,
    puzzle,
    stake,
    currency,
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
