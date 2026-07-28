import type { ScoreBreakdown } from './game'

export interface DuelPlayer {
  device: string
  address?: string
  submitted?: boolean
  score?: number
  breakdown?: ScoreBreakdown
  submittedAt?: number
}

export type DuelStatus = 'open' | 'accepted' | 'declined' | 'complete'

export type StakeCurrency = 'NIM' | 'USDC'

export interface Duel {
  id: string
  day: string
  puzzle: number
  stake: number // 0 = free duel for bragging rights
  currency: StakeCurrency // USDC settles on Base; NIM on the Nimiq chain
  status: DuelStatus
  createdAt: number
  a: DuelPlayer
  b?: DuelPlayer
  winner?: 'a' | 'b' | 'tie'
  settled?: boolean
  settledAt?: number
}

export interface DuelStore {
  get(id: string): Promise<Duel | null>
  put(duel: Duel): Promise<void>
  idsByDevice(device: string): Promise<string[]>
  linkDevice(device: string, id: string): Promise<void>
}

const TTL_MS = 3 * 86_400_000 // duels are day-scoped; keep 3 days for review

// In-memory store: perfect for the single-process Vite dev server. On
// Vercel serverless it does NOT persist across invocations — set
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN there to use Redis.
class MemoryStore implements DuelStore {
  private duels = new Map<string, Duel>()
  private byDevice = new Map<string, string[]>()

  async get(id: string): Promise<Duel | null> {
    const d = this.duels.get(id)
    if (!d) return null
    if (Date.now() - d.createdAt > TTL_MS) {
      this.duels.delete(id)
      return null
    }
    return d
  }

  async put(duel: Duel): Promise<void> {
    this.duels.set(duel.id, duel)
  }

  async idsByDevice(device: string): Promise<string[]> {
    return this.byDevice.get(device) ?? []
  }

  async linkDevice(device: string, id: string): Promise<void> {
    const ids = this.byDevice.get(device) ?? []
    if (!ids.includes(id)) ids.push(id)
    this.byDevice.set(device, ids)
  }
}

// Upstash Redis over REST — no SDK dependency needed.
class UpstashStore implements DuelStore {
  private url: string
  private token: string

  constructor(url: string, token: string) {
    this.url = url
    this.token = token
  }

  private async cmd<T>(...args: (string | number)[]): Promise<T> {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    })
    if (!res.ok) throw new Error(`upstash ${res.status}`)
    const body = (await res.json()) as { result: T }
    return body.result
  }

  async get(id: string): Promise<Duel | null> {
    const raw = await this.cmd<string | null>('GET', `duel:${id}`)
    return raw ? (JSON.parse(raw) as Duel) : null
  }

  async put(duel: Duel): Promise<void> {
    await this.cmd('SET', `duel:${duel.id}`, JSON.stringify(duel), 'PX', TTL_MS)
  }

  async idsByDevice(device: string): Promise<string[]> {
    return (await this.cmd<string[] | null>('SMEMBERS', `device:${device}`)) ?? []
  }

  async linkDevice(device: string, id: string): Promise<void> {
    await this.cmd('SADD', `device:${device}`, id)
    await this.cmd('PEXPIRE', `device:${device}`, TTL_MS)
  }
}

let store: DuelStore | null = null

export function getStore(): DuelStore {
  if (!store) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (url && token) {
      store = new UpstashStore(url, token)
    } else {
      if (process.env.VERCEL) {
        console.warn('No UPSTASH_REDIS_REST_URL set — duels will not persist across serverless invocations')
      }
      store = new MemoryStore()
    }
  }
  return store
}
