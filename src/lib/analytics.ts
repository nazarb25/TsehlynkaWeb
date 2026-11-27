import posthog from 'posthog-js'

import { setNumberFromText } from '@/lib/catalog/filters'

export type AnalyticsEvent =
  | 'app_open'
  | 'deep_link_open'
  | 'search_submit'
  | 'search_results_viewed'
  | 'search_suggestion_selected'
  | 'catalog_mode_change'
  | 'catalog_sort_change'
  | 'filters_applied'
  | 'theme_open'
  | 'set_viewed'
  | 'offer_sheet_open'
  | 'shop_clicked'
  | 'favorite_toggle'
  | 'price_watch_started'
  | 'price_watch_stopped'
  | 'telegram_opened'
  | 'error_shown'

type Properties = Record<string, string | number | boolean | null | undefined>

/** Джерела переходу з бота в параметрі `src`; інші значення не приймаються. */
export const ENTRY_SOURCES = ['bot_start', 'bot_menu', 'bot_search', 'inline', 'price_alert', 'share'] as const
export type EntrySource = (typeof ENTRY_SOURCES)[number]

export function entrySource(value: string | null): EntrySource | null {
  return (ENTRY_SOURCES as readonly string[]).includes(value ?? '') ? (value as EntrySource) : null
}

/** Пошуковий запит без самого тексту: номер чи текст і довжина групою. */
export function queryShape(text: string | null | undefined): { query_type: 'number' | 'text' | 'empty'; query_length_bucket: string } {
  const value = (text ?? '').trim()
  if (!value) return { query_type: 'empty', query_length_bucket: '0' }
  const length = [...value].length
  const bucket = length <= 2 ? '1-2' : length <= 5 ? '3-5' : length <= 10 ? '6-10' : length <= 20 ? '11-20' : '21+'
  return { query_type: setNumberFromText(value) ? 'number' : 'text', query_length_bucket: bucket }
}

/** Кількість групою, щоб порівнювати частку нульових і малих видач. */
export function countBucket(count: number): string {
  if (count <= 0) return '0'
  if (count === 1) return '1'
  if (count <= 10) return '2-10'
  if (count <= 50) return '11-50'
  return '51+'
}

/** Параметри адреси з текстом пошуку; у події не потрапляють. */
const PRIVATE_PARAMS = ['q', 'search']

export function stripPrivateParams(url: unknown): unknown {
  if (typeof url !== 'string' || !url.includes('?')) return url
  try {
    const parsed = new URL(url)
    let changed = false
    for (const name of PRIVATE_PARAMS) {
      if (parsed.searchParams.has(name)) {
        parsed.searchParams.set(name, '…')
        changed = true
      }
    }
    return changed ? parsed.toString() : url
  } catch {
    return url
  }
}

export function analyticsEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY) && posthog.__loaded
}

/** Подія PostHog; без ключа нічого не робить. */
export function track(event: AnalyticsEvent, properties: Properties = {}): void {
  if (!analyticsEnabled()) return
  posthog.capture(event, properties)
}

export function registerPlatform(platform: 'web' | 'telegram', client?: string): void {
  if (!analyticsEnabled()) return
  posthog.register({ platform, telegram_client: client ?? null })
}
