import type { Feedback, ScoreBreakdown, TodayInfo } from '../game/types'

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string) {
    super(code)
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? 'unknown')
  return data as T
}

export const fetchToday = () => request<TodayInfo>('/api/game/today')

export const startGame = () =>
  request<{ token: string; day: string; puzzle: number; startedAt: number }>('/api/game/start', {})

export const submitGuess = (token: string, guess: string) =>
  request<{
    token: string
    feedback: Feedback[]
    status: 'playing' | 'won' | 'lost'
    result?: ScoreBreakdown
    answer?: string
  }>('/api/game/guess', { token, guess })

export const buyHint = (token: string) =>
  request<{ token: string; hint: { pos: number; letter: string }; hintsUsed: number; hintsLeft: number }>(
    '/api/game/hint',
    { token },
  )
