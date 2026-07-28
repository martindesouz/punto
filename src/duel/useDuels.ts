import { useCallback, useEffect, useRef, useState } from 'react'
import { requestDeviceIdentifier } from '@nimiq/mini-app-sdk'
import { getNimiq } from '../nimiq/NimiqContext'
import { uuid } from '../lib/uuid'
import { ApiError } from '../lib/api'
import type { GameSnapshot } from '../game/types'
import { iLost, type DuelView } from './types'

const DEVICE_KEY = 'punto.device.v1'
const DEVICE_REASON = 'Punto uses a device identifier to track your duels and streaks — no account needed.'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) throw new ApiError(res.status, (data.error as string) ?? 'unknown', data)
  return data as T
}

// Stable device identity: the Nimiq Pay identifier when available (user
// consents once), otherwise a locally persisted uuid — which also covers
// browsers where crypto.randomUUID is unavailable over LAN http.
async function resolveDeviceId(): Promise<string> {
  const cached = localStorage.getItem(DEVICE_KEY)
  if (window.nimiqPay?.requestDeviceIdentifier) {
    try {
      const id = await requestDeviceIdentifier({ reason: DEVICE_REASON })
      localStorage.setItem(DEVICE_KEY, id)
      return id
    } catch {
      // user denied — fall through to the local fallback
    }
  }
  if (cached) return cached
  const local = uuid()
  localStorage.setItem(DEVICE_KEY, local)
  return local
}

export interface DuelsApi {
  deviceId: string | null
  duels: DuelView[]
  unsettled: number
  incoming: DuelView | null
  busy: boolean
  refresh: () => Promise<void>
  create: (stake: number) => Promise<DuelView | null>
  accept: (id: string) => Promise<boolean>
  decline: (id: string) => Promise<boolean>
  settle: (duel: DuelView) => Promise<'paid' | 'cancelled' | 'error'>
  clearIncoming: () => void
  buildLinks: (id: string) => { appUrl: string; deeplink: string }
}

interface Options {
  game: GameSnapshot | null
  notify: (msg: string) => void
}

export function useDuels({ game, notify }: Options): DuelsApi {
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [duels, setDuels] = useState<DuelView[]>([])
  const [unsettled, setUnsettled] = useState(0)
  const [incoming, setIncoming] = useState<DuelView | null>(null)
  const [busy, setBusy] = useState(false)
  const submittingRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    void resolveDeviceId().then(setDeviceId)
  }, [])

  const refresh = useCallback(async () => {
    if (!deviceId) return
    try {
      const res = await fetch(`/api/duel/list?device=${encodeURIComponent(deviceId)}`)
      if (!res.ok) return
      const data = (await res.json()) as { duels: DuelView[]; unsettled: number }
      setDuels(data.duels)
      setUnsettled(data.unsettled)
    } catch {
      // offline — keep whatever we have
    }
  }, [deviceId])

  // Pick up ?duel=<id> from a challenge deeplink.
  useEffect(() => {
    if (!deviceId) return
    const id = new URLSearchParams(window.location.search).get('duel')
    if (!id) return
    void (async () => {
      try {
        const res = await fetch(`/api/duel/get?id=${encodeURIComponent(id)}&device=${encodeURIComponent(deviceId)}`)
        if (!res.ok) {
          notify('That challenge link is invalid or gone')
          return
        }
        const data = (await res.json()) as { duel: DuelView }
        setIncoming(data.duel)
      } catch {
        notify('Could not load the challenge')
      }
    })()
  }, [deviceId, notify])

  useEffect(() => {
    void refresh()
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    const iv = window.setInterval(() => void refresh(), 20_000)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.clearInterval(iv)
    }
  }, [refresh])

  // Auto-submit my finished daily game to every duel I'm part of.
  useEffect(() => {
    if (!deviceId || !game || game.status === 'playing') return
    const pending = [...duels, ...(incoming && (incoming.a.isYou || incoming.b.isYou) ? [incoming] : [])].filter(d => {
      const mine = d.a.isYou ? d.a : d.b.isYou ? d.b : null
      return (
        mine !== null &&
        !mine.submitted &&
        d.day === game.day &&
        (d.status === 'accepted' || (d.status === 'open' && d.a.isYou)) &&
        !submittingRef.current.has(d.id)
      )
    })
    for (const d of pending) {
      submittingRef.current.add(d.id)
      void post<{ duel: DuelView }>('/api/duel/submit', { id: d.id, device: deviceId, token: game.token })
        .then(res => {
          setDuels(prev => prev.map(x => (x.id === res.duel.id ? res.duel : x)))
          setIncoming(prev => (prev?.id === res.duel.id ? res.duel : prev))
          if (res.duel.status === 'complete') notify('Duel complete — check the Duel tab!')
          else notify('Score locked in — waiting for your opponent')
        })
        .catch(() => {
          submittingRef.current.delete(d.id) // retry on next effect run
        })
        .finally(() => void refresh())
    }
  }, [deviceId, game, duels, incoming, notify, refresh])

  // For a staked duel we need this player's payout address, approved in
  // the wallet's native account dialog. The SDK reports a declined dialog
  // as a resolved { error } object, not a rejection.
  const getMyAddress = useCallback(async (): Promise<string | null> => {
    if (!window.nimiq && !window.nimiqPay) return null // clearly outside Nimiq Pay — skip the init timeout
    try {
      const nimiq = await getNimiq()
      const accounts = await nimiq.listAccounts()
      if (!Array.isArray(accounts)) return null // user declined the dialog
      return accounts[0] ?? null
    } catch {
      return null // not inside Nimiq Pay
    }
  }, [])

  const create = useCallback(
    async (stake: number): Promise<DuelView | null> => {
      if (!deviceId || busy) return null
      setBusy(true)
      try {
        let address: string | undefined
        if (stake > 0) {
          const addr = await getMyAddress()
          if (!addr) {
            notify('Staked duels need your wallet — open Punto inside Nimiq Pay and approve account access')
            return null
          }
          address = addr
        }
        const res = await post<{ duel: DuelView }>('/api/duel/create', { device: deviceId, stake, address })
        await refresh()
        return res.duel
      } catch {
        notify('Could not create the challenge')
        return null
      } finally {
        setBusy(false)
      }
    },
    [deviceId, busy, getMyAddress, notify, refresh],
  )

  const accept = useCallback(
    async (id: string): Promise<boolean> => {
      if (!deviceId || busy) return false
      setBusy(true)
      try {
        const target = incoming?.id === id ? incoming : duels.find(d => d.id === id)
        let address: string | undefined
        if ((target?.stake ?? 0) > 0) {
          const addr = await getMyAddress()
          if (!addr) {
            notify('Staked duels need your wallet — open Punto inside Nimiq Pay and approve account access')
            return false
          }
          address = addr
        }
        const res = await post<{ duel: DuelView }>('/api/duel/accept', { id, device: deviceId, address })
        setIncoming(res.duel)
        await refresh()
        return true
      } catch (err) {
        if (err instanceof ApiError && err.code === 'expired') notify('This challenge expired — duels last one day')
        else if (err instanceof ApiError && err.code === 'not_open') notify('This challenge is no longer open')
        else if (err instanceof ApiError && err.code === 'own_challenge') notify('That’s your own challenge!')
        else notify('Could not accept the challenge')
        return false
      } finally {
        setBusy(false)
      }
    },
    [deviceId, busy, duels, incoming, getMyAddress, notify, refresh],
  )

  const decline = useCallback(
    async (id: string): Promise<boolean> => {
      if (!deviceId || busy) return false
      setBusy(true)
      try {
        await post('/api/duel/decline', { id, device: deviceId })
        setIncoming(null)
        await refresh()
        notify('Challenge declined')
        return true
      } catch {
        notify('Could not decline — it may have expired')
        setIncoming(null)
        return false
      } finally {
        setBusy(false)
      }
    },
    [deviceId, busy, notify, refresh],
  )

  const settle = useCallback(
    async (duel: DuelView): Promise<'paid' | 'cancelled' | 'error'> => {
      if (!deviceId || !iLost(duel) || !duel.winnerAddress || duel.stake <= 0) return 'error'
      if (!window.nimiq && !window.nimiqPay) {
        notify('Open Punto inside Nimiq Pay to pay — or send it from any wallet to the address shown')
        return 'error'
      }
      try {
        const nimiq = await getNimiq()
        const result = await nimiq.sendBasicTransactionWithData({
          recipient: duel.winnerAddress.replace(/\s+/g, ''),
          value: Math.round(duel.stake * 100_000), // NIM → Luna
          data: `PUNTO duel ${duel.id.slice(0, 8)}`,
        })
        if (typeof result !== 'string') {
          // User cancelled the native dialog (or the wallet refused).
          notify('Payment cancelled — you can settle any time from the Duel tab')
          return 'cancelled'
        }
        await post('/api/duel/settle', { id: duel.id, device: deviceId, txHash: result })
        await refresh()
        notify('Duel settled — good game!')
        return 'paid'
      } catch {
        notify('Payment didn’t go through — open Punto inside Nimiq Pay to settle')
        return 'error'
      }
    },
    [deviceId, notify, refresh],
  )

  const buildLinks = useCallback((id: string) => {
    const appUrl = `${window.location.origin}/?duel=${id}`
    return { appUrl, deeplink: `nimiqpay://miniapp?url=${encodeURIComponent(appUrl)}` }
  }, [])

  return {
    deviceId,
    duels,
    unsettled,
    incoming,
    busy,
    refresh,
    create,
    accept,
    decline,
    settle,
    clearIncoming: () => {
      setIncoming(null)
      window.history.replaceState(null, '', window.location.pathname)
    },
    buildLinks,
  }
}
