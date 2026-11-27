'use client'

import { useEffect } from 'react'

import { type AnalyticsEvent, entrySource, track } from '@/lib/analytics'

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

function resourceType(path: string): string {
  if (path.startsWith('/sets/')) return 'set'
  if (path.startsWith('/themes')) return 'theme'
  if (path.startsWith('/search') || path.startsWith('/catalog')) return 'search'
  if (path.startsWith('/price-alerts')) return 'price_alerts'
  return path === '/' ? 'home' : 'other'
}

function themeMode(): 'dark' | 'light' {
  const telegram = window.Telegram?.WebApp?.colorScheme
  if (telegram === 'dark' || telegram === 'light') return telegram
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Відкриття сайту раз за сесію вкладки й перехід з бота за параметром `src`.
 * Параметр прибирається з адреси, щоб не потрапити в поширене посилання.
 */
export function EntryTracker() {
  useEffect(() => {
    const url = new URL(window.location.href)
    const source = entrySource(url.searchParams.get('src'))
    const resolved = !document.querySelector('[data-not-found]')
    let opened = false
    try {
      opened = window.sessionStorage.getItem(OPENED_KEY) === '1'
      window.sessionStorage.setItem(OPENED_KEY, '1')
    } catch {}
    if (!opened || source) {
      track('app_open', {
        entry_source: source ?? (document.referrer ? 'referrer' : 'direct'),
        client_platform: window.Telegram?.WebApp?.initData ? 'telegram' : 'web',
        theme_mode: themeMode(),
      })
    }
    if (source) {
      track('deep_link_open', { source, resource_type: resourceType(url.pathname), resolved })
      url.searchParams.delete('src')
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    }
  }, [])
  return null
}
