'use client'

import { useEffect } from 'react'

import { type AnalyticsEvent, track } from '@/lib/analytics'

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
