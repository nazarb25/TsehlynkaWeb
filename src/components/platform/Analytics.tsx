'use client'

import { useEffect, useRef, useState } from 'react'

import { type AnalyticsEvent, type EntrySource, entrySource, track } from '@/lib/analytics'
import { launchedFromTelegram } from '@/lib/platform/telegram'

import { usePlatform } from './TelegramBridge'

/**
 * Кліки по елементах з `data-track="подія"`: властивості беруться з атрибутів `data-track-*`.
 * Так серверні компоненти позначають посилання на магазини й Telegram без власного JavaScript.
 */
export function AnalyticsClicks() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const element = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-track]')
      if (!element) return
      const properties: Record<string, string> = {}
      for (const [key, value] of Object.entries(element.dataset)) {
        if (key.startsWith('track') && key !== 'track' && value !== undefined) {
          const name = key.slice(5).replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`).replace(/^_/, '')
          properties[name] = value
        }
      }
      track(element.dataset.track as AnalyticsEvent, properties)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])
  return null
}

type Properties = Record<string, string | number | boolean | null | undefined>

/** Подія при показі сторінки: перегляд набору, результати пошуку. */
export function TrackView({ event, properties }: { event: AnalyticsEvent; properties: Properties }) {
  const key = JSON.stringify(properties)
  useEffect(() => {
    track(event, JSON.parse(key) as Properties)
  }, [event, key])
  return null
}

const OPENED_KEY = 'ts_app_opened'
/** Скільки чекати Telegram SDK, перш ніж записати відкриття без його теми. */
const TELEGRAM_WAIT_MS = 3000

function resourceType(path: string): string {
  if (path.startsWith('/sets/')) return 'set'
  if (path.startsWith('/themes')) return 'theme'
  if (path.startsWith('/search') || path.startsWith('/catalog')) return 'search'
  if (path.startsWith('/price-alerts')) return 'price_alerts'
  return path === '/' ? 'home' : 'other'
}

function browserTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Відкриття сайту раз за сесію вкладки й перехід з бота за параметром `src`.
 * У Telegram подія чекає SDK, щоб записати його тему. Параметр прибирається з адреси,
 * щоб не потрапити в поширене посилання.
 */
export function EntryTracker() {
  const { telegram } = usePlatform()
  const entry = useRef<{ source: EntrySource | null; path: string; resolved: boolean; telegram: boolean } | null>(null)
  const sent = useRef(false)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    const source = entrySource(url.searchParams.get('src'))
    let opened = false
    try {
      opened = window.sessionStorage.getItem(OPENED_KEY) === '1'
      window.sessionStorage.setItem(OPENED_KEY, '1')
    } catch {}
    if (opened && !source) return
    entry.current = {
      source,
      path: url.pathname,
      resolved: !document.querySelector('[data-not-found]'),
      telegram: launchedFromTelegram(),
    }
    if (source) {
      url.searchParams.delete('src')
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    }
    const timer = window.setTimeout(() => setTimedOut(true), TELEGRAM_WAIT_MS)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const current = entry.current
    if (!current || sent.current) return
    if (current.telegram && !telegram && !timedOut) return
    sent.current = true
    track('app_open', {
      entry_source: current.source ?? (document.referrer ? 'referrer' : 'direct'),
      client_platform: current.telegram ? 'telegram' : 'web',
      theme_mode: telegram ? telegram.colorScheme : browserTheme(),
    })
    if (current.source) {
      track('deep_link_open', { source: current.source, resource_type: resourceType(current.path), resolved: current.resolved })
    }
  }, [telegram, timedOut])
  return null
}
