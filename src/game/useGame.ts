import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, buyHint, fetchToday, startGame, submitGuess } from '../lib/api'
import { clearGame, getStreak, loadGame, recordWin, saveGame } from './storage'
import type { Feedback, GameSnapshot, TodayInfo } from './types'

export type Phase = 'loading' | 'ready' | 'playing' | 'won' | 'lost' | 'offline'

export interface GameApi {
  phase: Phase
  today: TodayInfo | null
  game: GameSnapshot | null
  current: string
  invalidShake: boolean
  busy: boolean
  toast: string | null
  elapsedMs: number
  streak: number
  keyStates: Record<string, Feedback>
  start: () => Promise<void>
  pressKey: (key: string) => void
  requestHint: () => Promise<void>
  retry: () => void
  notify: (msg: string) => void
}

const TOAST_MS = 1800

export function useGame(): GameApi {
  const [phase, setPhase] = useState<Phase>('loading')
  const [today, setToday] = useState<TodayInfo | null>(null)
  const [game, setGame] = useState<GameSnapshot | null>(null)
  const [current, setCurrent] = useState('')
  const [invalidShake, setInvalidShake] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [streak, setStreak] = useState(0)
  const toastTimer = useRef<number | undefined>(undefined)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), TOAST_MS)
  }, [])

  const boot = useCallback(async () => {
    setPhase('loading')
    try {
      const info = await fetchToday()
      setToday(info)
      setStreak(getStreak(info.day))
      const stored = loadGame()
      if (stored && stored.day === info.day) {
        setGame(stored)
        setPhase(stored.status)
      } else {
        if (stored) clearGame()
        setGame(null)
        setPhase('ready')
      }
    } catch {
      setPhase('offline')
    }
  }, [])

  useEffect(() => {
    void boot()
  }, [boot])

  // Ticking timer while playing; frozen once the game ends.
  useEffect(() => {
    if (!game) return
    if (game.status !== 'playing') {
      setElapsedMs((game.endedAt ?? game.startedAt) - game.startedAt)
      return
    }
    const tick = () => setElapsedMs(Date.now() - game.startedAt)
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [game])

  const update = useCallback((next: GameSnapshot) => {
    setGame(next)
    saveGame(next)
  }, [])

  const start = useCallback(async () => {
    if (busy) return
    setBusy(true)
    try {
      const res = await startGame()
      const snapshot: GameSnapshot = {
        day: res.day,
        puzzle: res.puzzle,
        token: res.token,
        rows: [],
        hints: [],
        status: 'playing',
        startedAt: Date.now(),
      }
      update(snapshot)
      setCurrent('')
      setPhase('playing')
    } catch {
      showToast('Could not reach the server')
    } finally {
      setBusy(false)
    }
  }, [busy, showToast, update])

  const submit = useCallback(async () => {
    if (!game || !today || game.status !== 'playing' || busy) return
    if (current.length !== today.wordLength) {
      setInvalidShake(true)
      window.setTimeout(() => setInvalidShake(false), 500)
      showToast('Not enough letters')
      return
    }
    setBusy(true)
    try {
      const res = await submitGuess(game.token, current)
      const next: GameSnapshot = {
        ...game,
        token: res.token,
        rows: [...game.rows, { guess: current, fb: res.feedback }],
        status: res.status,
        endedAt: res.status === 'playing' ? undefined : Date.now(),
        result: res.result,
        answer: res.answer,
      }
      update(next)
      setCurrent('')
      if (res.status !== 'playing') {
        setPhase(res.status)
        if (res.status === 'won') setStreak(recordWin(next.day))
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'not_a_word') {
        setInvalidShake(true)
        window.setTimeout(() => setInvalidShake(false), 500)
        showToast('Not in the word list')
      } else if (err instanceof ApiError && err.code === 'expired') {
        showToast('New day, new Punto!')
        clearGame()
        void boot()
      } else {
        showToast('Could not reach the server')
      }
    } finally {
      setBusy(false)
    }
  }, [game, today, busy, current, boot, showToast, update])

  const pressKey = useCallback(
    (key: string) => {
      if (!game || !today || game.status !== 'playing') return
      if (key === 'enter') {
        void submit()
      } else if (key === 'backspace') {
        setCurrent(c => c.slice(0, -1))
      } else if (/^[a-z]$/.test(key)) {
        setCurrent(c => (c.length < today.wordLength ? c + key : c))
      }
    },
    [game, today, submit],
  )

  const requestHint = useCallback(async () => {
    if (!game || !today || game.status !== 'playing' || busy) return
    if (game.hints.length >= today.maxHints) {
      showToast('No hints left today')
      return
    }
    setBusy(true)
    try {
      const res = await buyHint(game.token)
      update({ ...game, token: res.token, hints: [...game.hints, res.hint] })
      showToast(`Letter ${res.hint.pos + 1} is “${res.hint.letter.toUpperCase()}”`)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'nothing_to_reveal') {
        showToast('Nothing left to reveal — finish it!')
      } else if (err instanceof ApiError && err.code === 'no_hints_left') {
        showToast('No hints left today')
      } else {
        showToast('Could not reach the server')
      }
    } finally {
      setBusy(false)
    }
  }, [game, today, busy, showToast, update])

  // Physical keyboard support.
  useEffect(() => {
    if (phase !== 'playing') return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === 'enter' || k === 'backspace' || /^[a-z]$/.test(k)) {
        e.preventDefault()
        pressKey(k)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, pressKey])

  // Best-known state per letter for keyboard coloring: c beats p beats a.
  const keyStates: Record<string, Feedback> = {}
  if (game) {
    const rank = { a: 0, p: 1, c: 2 }
    for (const row of game.rows) {
      row.fb.forEach((fb, i) => {
        const ch = row.guess[i]
        if (!(ch in keyStates) || rank[fb] > rank[keyStates[ch]]) keyStates[ch] = fb
      })
    }
  }

  return {
    phase,
    today,
    game,
    current,
    invalidShake,
    busy,
    toast,
    elapsedMs,
    streak,
    keyStates,
    start,
    pressKey,
    requestHint,
    retry: () => void boot(),
    notify: showToast,
  }
}
