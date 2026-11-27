'use client'

import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState } from 'react'

const PREFIX = 'tsehlynka:list:'
const LEAVE_FREEZE_MS = 1500

let historyReturn = false
if (typeof window !== 'undefined') {
  const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  historyReturn = entry?.type === 'back_forward'
  window.addEventListener(
    'popstate',
    () => {
      historyReturn = true
    },
    { capture: true },
  )
  const pushState = window.history.pushState.bind(window.history)
  window.history.pushState = (...args: Parameters<History['pushState']>) => {
    historyReturn = false
    pushState(...args)
  }
}

interface Snapshot<S> {
  state: S
  scroll: number
}

function storageKey(id: string): string {
  return `${PREFIX}${id}:${window.location.pathname}${window.location.search}`
}

function read<S>(key: string): Snapshot<S> | null {
  try {
    const raw = window.sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Snapshot<S>) : null
  } catch {
    return null
  }
}

function write<S>(key: string, snapshot: Snapshot<S>) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(snapshot))
  } catch {}
}

function remove(key: string) {
  try {
    window.sessionStorage.removeItem(key)
  } catch {}
}

/**
 * Стан списку з «Показати ще», що переживає перехід у набір і повернення «Назад»: дозавантажені
 * сторінки й прокрутка відновлюються лише при поверненні історією, новий перехід починає список спочатку.
 * Зберігається лише список, який змінювали: прихована на цій ширині копія нічого не пише й не прокручує.
 */
export function useRestorableList<S>(id: string, initial: S): [S, Dispatch<SetStateAction<S>>] {
  const [state, setState] = useState(initial)
  const key = useRef<string | null>(null)
  const pendingScroll = useRef<number | null>(null)
  const latest = useRef(state)
  const touched = useRef(false)

  useEffect(() => {
    const current = storageKey(id)
    const frame = window.requestAnimationFrame(() => {
      const saved = historyReturn ? read<S>(current) : null
      if (!saved) remove(current)
      if (saved) {
        touched.current = true
        pendingScroll.current = saved.scroll
        setState(saved.state)
      }
      key.current = current
    })
    return () => window.cancelAnimationFrame(frame)
  }, [id])

  useEffect(() => {
    latest.current = state
    const current = key.current
    if (!current || !touched.current) return
    if (pendingScroll.current !== null) {
      window.scrollTo(0, pendingScroll.current)
      pendingScroll.current = null
    }
    write(current, { state, scroll: window.scrollY })
  }, [state])

  useEffect(() => {
    let frame = 0
    let leftAt = -Infinity
    const save = () => {
      if (key.current && touched.current && pendingScroll.current === null) write(key.current, { state: latest.current, scroll: window.scrollY })
    }
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        if (performance.now() - leftAt > LEAVE_FREEZE_MS) save()
      })
    }
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href]')
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank' || link.origin !== window.location.origin) return
      save()
      leftAt = performance.now()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('click', onClick, { capture: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('click', onClick, { capture: true })
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  const update = useCallback<Dispatch<SetStateAction<S>>>((action) => {
    touched.current = true
    setState(action)
  }, [])

  return [state, update]
}
