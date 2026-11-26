'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { useAuth } from '@/components/auth/AuthProvider'

/** Набір, який користувач хотів зберегти до входу; додається одразу після входу. */
const PENDING_KEY = 'ts_pending_favourite'
const BATCH = 100

interface Favourites {
  /** `undefined` — ще невідомо. */
  state(setId: string): boolean | undefined
  watch(setId: string): () => void
  toggle(setId: string, selected: boolean): void
}

const FavouritesContext = createContext<Favourites>({ state: () => undefined, watch: () => () => {}, toggle: () => {} })

function readPending(): string | null {
  try {
    const value = window.sessionStorage.getItem(PENDING_KEY)
    window.sessionStorage.removeItem(PENDING_KEY)
    return value
  } catch {
    return null
  }
}

function writePending(setId: string): void {
  try {
    window.sessionStorage.setItem(PENDING_KEY, setId)
  } catch {}
}

async function send(setId: string, selected: boolean): Promise<number> {
  const response = await fetch(`/api/me/favourites/${encodeURIComponent(setId)}`, { method: selected ? 'PUT' : 'DELETE' })
  return response.status
}

/** Позначки обраного для всіх сердечок сторінки: одним запитом на кожні 100 наборів. */
export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const { account, openLogin } = useAuth()
  const [known, setKnown] = useState<Record<string, boolean>>({})
  const requested = useRef(new Set<string>())
  const queued = useRef(new Set<string>())
  const timer = useRef<number | null>(null)

  const flush = useCallback(async () => {
    timer.current = null
    const ids = [...queued.current].filter((id) => !requested.current.has(id))
    queued.current.clear()
    for (const id of ids) requested.current.add(id)
    for (let start = 0; start < ids.length; start += BATCH) {
      const chunk = ids.slice(start, start + BATCH)
      try {
        const response = await fetch(`/api/me/favourites/ids?${new URLSearchParams(chunk.map((id) => ['set_id', id]))}`)
        if (!response.ok) {
          for (const id of chunk) requested.current.delete(id)
          continue
        }
        const stored = new Set(((await response.json()) as { set_ids: string[] }).set_ids)
        setKnown((value) => ({ ...Object.fromEntries(chunk.map((id) => [id, stored.has(id)])), ...value }))
      } catch {}
    }
  }, [])

  const watch = useCallback(
    (setId: string) => {
      if (!account) return () => {}
      queued.current.add(setId)
      if (timer.current === null) timer.current = window.setTimeout(flush, 30)
      return () => queued.current.delete(setId)
    },
    [account, flush],
  )

  const change = useCallback(
    async (setId: string, selected: boolean) => {
      setKnown((value) => ({ ...value, [setId]: selected }))
      const status = await send(setId, selected).catch(() => 0)
      if (status === 204) return
      setKnown((value) => ({ ...value, [setId]: !selected }))
      if (status === 401) {
        if (selected) writePending(setId)
        openLogin()
      }
    },
    [openLogin],
  )

  const toggle = useCallback(
    (setId: string, selected: boolean) => {
      if (!account) {
        writePending(setId)
        openLogin()
        return
      }
      void change(setId, !selected)
    },
    [account, change, openLogin],
  )

  useEffect(() => {
    if (!account) return
    const pending = readPending()
    if (!pending) return
    const timer = window.setTimeout(() => void change(pending, true), 0)
    return () => window.clearTimeout(timer)
  }, [account, change])

  const value = useMemo<Favourites>(() => ({ state: (setId) => known[setId], watch, toggle }), [known, watch, toggle])
  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>
}

export function useFavourite(setId: string, initial?: boolean): { selected: boolean; toggle(): void } {
  const { state, watch, toggle } = useContext(FavouritesContext)
  useEffect(() => (initial === undefined ? watch(setId) : undefined), [initial, setId, watch])
  const selected = state(setId) ?? initial ?? false
  return { selected, toggle: () => toggle(setId, selected) }
}

export function useFavourites(): Favourites {
  return useContext(FavouritesContext)
}
