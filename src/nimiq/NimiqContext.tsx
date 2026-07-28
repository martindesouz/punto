import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { init } from '@nimiq/mini-app-sdk'

export type WalletStatus = 'connecting' | 'ready' | 'unavailable'

interface NimiqContextValue {
  status: WalletStatus
  error: string | null
}

const NimiqContext = createContext<NimiqContextValue>({ status: 'connecting', error: null })

// Keep the provider promise at module level so re-mounts don't re-init.
let nimiqPromise: ReturnType<typeof init> | null = null

export function getNimiq() {
  nimiqPromise ??= init({ timeout: 10_000 })
  return nimiqPromise
}

// Initializes the Nimiq provider without blocking the game. Outside Nimiq
// Pay the init times out and the app stays fully playable — only wallet
// features (phase 2+) need the provider.
export function NimiqProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<NimiqContextValue>({ status: 'connecting', error: null })

  useEffect(() => {
    let cancelled = false
    getNimiq()
      .then(() => {
        if (!cancelled) setValue({ status: 'ready', error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          nimiqPromise = null // allow a retry later (e.g. phase 2 payment tap)
          setValue({ status: 'unavailable', error: err instanceof Error ? err.message : String(err) })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return <NimiqContext.Provider value={value}>{children}</NimiqContext.Provider>
}

export function useNimiq(): NimiqContextValue {
  return useContext(NimiqContext)
}
