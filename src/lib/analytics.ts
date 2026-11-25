import posthog from 'posthog-js'

export type AnalyticsEvent =
  | 'search_results_viewed'
  | 'search_suggestion_selected'
  | 'filters_applied'
  | 'set_viewed'
  | 'shop_clicked'
  | 'telegram_watch_clicked'
  | 'telegram_opened'

type Properties = Record<string, string | number | boolean | null | undefined>

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
