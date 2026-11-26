'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/components/auth/AuthProvider'
import { track } from '@/lib/analytics'

/** Набір, за ціною якого користувач хотів стежити до входу; стеження вмикається одразу після входу. */
const PENDING_KEY = 'ts_pending_watch'

export const WATCH_LIMIT_TEXT = 'Ви вже стежите за 100 наборами. Щоб додати новий, вимкніть одне зі стежень'

export type WatchNotice = 'started' | 'limit' | 'failed' | null

interface Watch {
  /** `undefined` — ще невідомо. */
  watching: boolean | undefined
  busy: boolean
  notice: WatchNotice
  bot: string
  toggle(): void
}

const WatchContext = createContext<Watch | null>(null)

function takePending(setId: string): boolean {
  try {
    if (window.sessionStorage.getItem(PENDING_KEY) !== setId) return false
    window.sessionStorage.removeItem(PENDING_KEY)
    return true
  } catch {
    return false
  }
}

function writePending(setId: string): void {
  try {
    window.sessionStorage.setItem(PENDING_KEY, setId)
  } catch {}
}

/** Стан стеження за ціною одного набору, спільний для мобільної й десктопної сторінки набору. */
export function WatchProvider({ setId, bot, children }: { setId: string; bot: string; children: React.ReactNode }) {
  const { account, openLogin } = useAuth()
  const [watching, setWatching] = useState<boolean | undefined>(account ? undefined : false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<WatchNotice>(null)

  const change = useCallback(
    async (next: boolean) => {
      setBusy(true)
      setNotice(null)
      try {
        const response = await fetch(`/api/me/price-alerts/${setId}`, { method: next ? 'PUT' : 'DELETE' })
        if (response.status === 204) {
          setWatching(next)
          setNotice(next ? 'started' : null)
          track(next ? 'price_watch_started' : 'price_watch_stopped', { set_id: setId })
        } else if (response.status === 401) {
          if (next) writePending(setId)
          openLogin()
        } else {
          setNotice(response.status === 409 ? 'limit' : 'failed')
        }
      } catch {
        setNotice('failed')
      } finally {
        setBusy(false)
      }
    },
    [openLogin, setId],
  )

  useEffect(() => {
    if (!account) return
    let active = true
    const pending = takePending(setId)
    void (async () => {
      try {
        const response = await fetch(`/api/me/price-alerts/${setId}`)
        if (!response.ok) return
        const { watching: current } = (await response.json()) as { watching: boolean }
        if (!active) return
        setWatching(current)
        if (pending && !current) void change(true)
      } catch {}
    })()
    return () => {
      active = false
    }
  }, [account, change, setId])

  const toggle = useCallback(() => {
    if (busy) return
    if (!account) {
      writePending(setId)
      openLogin()
      return
    }
    if (watching === undefined) return
    void change(!watching)
  }, [account, busy, change, openLogin, setId, watching])

  const value = useMemo<Watch>(() => ({ watching, busy, notice, bot, toggle }), [watching, busy, notice, bot, toggle])
  return <WatchContext.Provider value={value}>{children}</WatchContext.Provider>
}

export function useWatch(): Watch | null {
  return useContext(WatchContext)
}
