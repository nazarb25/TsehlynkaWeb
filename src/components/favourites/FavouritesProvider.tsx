'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { useAuth } from '@/components/auth/AuthProvider'
import { useToast } from '@/components/personal/Toast'
import { track } from '@/lib/analytics'

/** Набір, який користувач хотів зберегти до входу; додається одразу після входу. */
const PENDING_KEY = 'ts_pending_favourite'
const BATCH = 100
const LIMIT_STATUS = 409
export const FAVOURITE_LIMIT_TEXT = 'Досягнуто ліміту обраного (1000 наборів). Приберіть один із наборів, щоб додати новий'
const FAILED_TEXT = 'Не вдалося оновити обране. Спробуйте ще раз'

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
  /** Останній вибір користувача й набори, для яких запит ще йде: запити одного набору йдуть по черзі. */
  const wanted = useRef(new Map<string, boolean>())
  const sending = useRef(new Set<string>())
  const [toast, showToast] = useToast()

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
      wanted.current.set(setId, selected)
      if (sending.current.has(setId)) return
      sending.current.add(setId)
      let saved = !selected
      try {
        for (let target = selected; ; target = wanted.current.get(setId) ?? target) {
          if (target === saved) return
          const status = await send(setId, target).catch(() => 0)
          if (status === 204) {
            saved = target
            track('favorite_toggle', { action: target ? 'add' : 'remove', result: 'ok' })
            continue
          }
          wanted.current.set(setId, saved)
          setKnown((value) => ({ ...value, [setId]: saved }))
          const result = status === 401 ? 'login' : status === LIMIT_STATUS ? 'limit' : 'failed'
          track('favorite_toggle', { action: target ? 'add' : 'remove', result })
          if (status === 401) {
            if (target) writePending(setId)
            openLogin()
          } else showToast(status === LIMIT_STATUS ? FAVOURITE_LIMIT_TEXT : FAILED_TEXT)
          return
        }
      } finally {
        sending.current.delete(setId)
      }
    },
    [openLogin, showToast],
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
  return (
    <FavouritesContext.Provider value={value}>
      {children}
      <div className="c-desk c-toast-host">{toast}</div>
    </FavouritesContext.Provider>
  )
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
