import 'server-only'

import * as Sentry from '@sentry/nextjs'

const TIMEOUT_MS = 8000

export class AccountUnavailableError extends Error {
  override name = 'AccountUnavailableError'
}

export interface OpenedSession {
  token: string
  expires_at: string
}

export interface Profile {
  telegram_id: number
  first_name: string
  last_name: string | null
  username: string | null
  language_code: string | null
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

/** Особистий запит до API без кешу; повертає `null`, коли API відхилив облікові дані (401). */
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
  if (!response.ok) {
    Sentry.logger.error('Account API responded with an error', { path, status: response.status })
    throw new AccountUnavailableError(`API відповів ${response.status}: ${path}`)
  }
  return response.status === 204 ? (null as T) : ((await response.json()) as T)
}

export function openTelegramSession(idToken: string): Promise<OpenedSession | null> {
  return send<OpenedSession>('/sessions/telegram', { method: 'POST', body: { id_token: idToken } })
}

export function openMiniAppSession(initData: string): Promise<OpenedSession | null> {
  return send<OpenedSession>('/sessions/mini-app', { method: 'POST', credentials: { initData } })
}

export async function closeSession(session: string): Promise<void> {
  await send<null>('/sessions/current', { method: 'DELETE', credentials: { session } })
}

export function getProfile(session: string): Promise<Profile | null> {
  return send<Profile>('/me', { method: 'GET', credentials: { session } })
}
