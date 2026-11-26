import 'server-only'

import * as Sentry from '@sentry/nextjs'

import { withRetail } from '@/lib/api/catalog'
import type { Page, SetItem } from '@/lib/api/types'

const TIMEOUT_MS = 8000

export class AccountUnavailableError extends Error {
  override name = 'AccountUnavailableError'
}

/** API відхилив запит із причиною в даних (4xx, крім 401): невірне значення, ліміт, невідомий набір. */
export class AccountRequestError extends Error {
  override name = 'AccountRequestError'

  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

export interface OpenedSession {
  token: string
  expires_at: string
}

export interface PersonalData {
  email: string | null
  phone: string | null
  phone_source: 'telegram_contact' | 'user_input' | null
  birth_date: string | null
}

export type PersonalField = 'email' | 'phone' | 'birth_date'

export interface Profile {
  telegram_id: number
  first_name: string
  last_name: string | null
  username: string | null
  language_code: string | null
  personal_data: PersonalData
  favourites_count: number
  recently_viewed_count: number
}

type Credentials = { session: string } | { initData: string }

function apiUrl(path: string): URL {
  const base = process.env.API_BASE_URL
  if (!base) throw new AccountUnavailableError('API_BASE_URL не задано')
  return new URL(path.replace(/^\//, ''), base.endsWith('/') ? base : `${base}/`)
}

function authorization(credentials?: Credentials): Record<string, string> {
  if (!credentials) return {}
  return { Authorization: 'session' in credentials ? `Bearer ${credentials.session}` : `tma ${credentials.initData}` }
}

async function rejectionReason(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { error?: unknown; message?: unknown }
    return [body.error, body.message].filter((part) => typeof part === 'string').join(': ') || null
  } catch {
    return null
  }
}

/** Особистий запит до API без кешу; повертає `null`, коли API відхилив облікові дані (401), і `undefined` на 204. */
async function send<T>(path: string, init: { method: string; credentials?: Credentials; body?: unknown }): Promise<T | null> {
  let response: Response
  try {
    response = await fetch(apiUrl(path), {
      method: init.method,
      headers: {
        Accept: 'application/json',
        ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...authorization(init.credentials),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    Sentry.logger.error('Account API request failed', { path, reason: String(error) })
    throw new AccountUnavailableError(`API недоступний: ${path}`, { cause: error })
  }
  if (response.status === 401) {
    Sentry.logger.warn('Account API rejected credentials', { path, reason: await rejectionReason(response) })
    return null
  }
  if (response.status >= 400 && response.status < 500) {
    throw new AccountRequestError(response.status, `API відхилив ${init.method} ${path}: ${response.status}`)
  }
  if (!response.ok) {
    Sentry.logger.error('Account API responded with an error', { path, status: response.status })
    throw new AccountUnavailableError(`API відповів ${response.status}: ${path}`)
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}

export function openTelegramSession(idToken: string): Promise<OpenedSession | null> {
  return send<OpenedSession>('/sessions/telegram', { method: 'POST', body: { id_token: idToken } })
}

export function openMiniAppSession(initData: string): Promise<OpenedSession | null> {
  return send<OpenedSession>('/sessions/mini-app', { method: 'POST', credentials: { initData } })
}

export async function closeSession(session: string): Promise<void> {
  await send<undefined>('/sessions/current', { method: 'DELETE', credentials: { session } })
}

export function getProfile(session: string): Promise<Profile | null> {
  return send<Profile>('/me', { method: 'GET', credentials: { session } })
}

export async function listFavourites(session: string, offset: number, limit = 20): Promise<Page<SetItem> | null> {
  const page = await send<Page<SetItem>>(`/me/favourites?limit=${limit}&offset=${offset}`, { method: 'GET', credentials: { session } })
  return page ? { ...page, items: await withRetail(page.items) } : null
}

/** Які з наборів є в обраному; до 100 за запит. */
export async function favouriteIds(session: string, setIds: string[]): Promise<string[] | null> {
  if (setIds.length === 0) return []
  const query = new URLSearchParams(setIds.slice(0, 100).map((id) => ['set_id', id]))
  const result = await send<{ set_ids: string[] }>(`/me/favourites/membership?${query}`, { method: 'GET', credentials: { session } })
  return result ? result.set_ids : null
}

/** Додати чи прибрати набір з обраного; `false` — сесію відхилено. */
export async function setFavourite(session: string, setId: string, selected: boolean): Promise<boolean> {
  const result = await send<undefined>(`/me/favourites/${encodeURIComponent(setId)}`, { method: selected ? 'PUT' : 'DELETE', credentials: { session } })
  return result !== null
}

export async function recentSets(session: string): Promise<SetItem[] | null> {
  const items = await send<SetItem[]>('/me/recently-viewed', { method: 'GET', credentials: { session } })
  return items ? withRetail(items) : null
}

/** `false` — сесію відхилено. */
export async function recordView(session: string, setId: string): Promise<boolean> {
  return (await send<undefined>(`/me/recently-viewed/${encodeURIComponent(setId)}`, { method: 'POST', credentials: { session } })) !== null
}

/** `false` — сесію відхилено. */
export async function clearRecent(session: string): Promise<boolean> {
  return (await send<undefined>('/me/recently-viewed', { method: 'DELETE', credentials: { session } })) !== null
}

/** Змінити одне поле особистих даних; `null` очищає його. */
export function updatePersonalData(session: string, field: PersonalField, value: string | null): Promise<PersonalData | null> {
  return send<PersonalData>('/me/personal-data', { method: 'PATCH', credentials: { session }, body: { [field]: value } })
}

/** `false` — сесію відхилено. */
export async function clearPersonalData(session: string): Promise<boolean> {
  return (await send<undefined>('/me/personal-data', { method: 'DELETE', credentials: { session } })) !== null
}

/** Стеження за ціною: набір і ціна, нижче за яку надійде сповіщення; `null` — повідомимо про появу в наявності. */
export type PriceAlert = SetItem & { watched_since: string; baseline_price: string | null }

/** Найбільше стежень за ціною в одного користувача. */
export const PRICE_ALERT_LIMIT = 100

export async function listPriceAlerts(session: string, offset: number, limit = 20): Promise<Page<PriceAlert> | null> {
  const page = await send<Page<PriceAlert>>(`/me/price-alerts?limit=${limit}&offset=${offset}`, { method: 'GET', credentials: { session } })
  return page ? { ...page, items: await withRetail(page.items) } : null
}

/** Кількість стежень без самих наборів. */
export async function countPriceAlerts(session: string): Promise<number | null> {
  const page = await send<Page<PriceAlert>>('/me/price-alerts?limit=1&offset=0', { method: 'GET', credentials: { session } })
  return page ? page.total : null
}

export async function isWatchingPrice(session: string, setId: string): Promise<boolean | null> {
  const result = await send<{ is_watching: boolean }>(`/me/price-alerts/${encodeURIComponent(setId)}`, { method: 'GET', credentials: { session } })
  return result ? result.is_watching : null
}

/** Стежити чи не стежити за ціною набору; `false` — сесію відхилено, понад ліміт — `AccountRequestError(409)`. */
export async function setPriceAlert(session: string, setId: string, watching: boolean): Promise<boolean> {
  const result = await send<undefined>(`/me/price-alerts/${encodeURIComponent(setId)}`, { method: watching ? 'PUT' : 'DELETE', credentials: { session } })
  return result !== null
}
