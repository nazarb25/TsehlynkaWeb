import 'server-only'

import * as Sentry from '@sentry/nextjs'

export class CatalogUnavailableError extends Error {
  override name = 'CatalogUnavailableError'
}

export class NotFoundError extends Error {
  override name = 'NotFoundError'
}

type QueryValue = string | number | boolean | null | undefined
export type Query = Record<string, QueryValue | QueryValue[]>

const TIMEOUT_MS = 8000
const SLOW_MS = 1500
const ID_SEGMENT = /^[0-9a-f-]{32,36}$/i

/** Шлях без ідентифікаторів, щоб метрики групувалися за ендпоінтом. */
function endpointName(path: string): string {
  return path
    .split('/')
    .map((segment) => (ID_SEGMENT.test(segment) ? ':id' : segment))
    .join('/')
}

function baseUrl(): string {
  const value = process.env.API_BASE_URL
  if (!value) throw new CatalogUnavailableError('API_BASE_URL не задано')
  return value.endsWith('/') ? value : `${value}/`
}

function buildUrl(path: string, query?: Query): URL {
  const url = new URL(path.replace(/^\//, ''), baseUrl())
  for (const [name, raw] of Object.entries(query ?? {})) {
    const values = Array.isArray(raw) ? raw : [raw]
    for (const value of values) {
      if (value === null || value === undefined || value === '') continue
      url.searchParams.append(name, String(value))
    }
  }
  return url
}

/** GET до Tsehlynka API лише з сервера; відповідь кешується на `revalidate` секунд. */
export async function apiGet<T>(path: string, query?: Query, revalidate = 300): Promise<T> {
  const url = buildUrl(path, query)
  const endpoint = endpointName(path)
  const started = performance.now()
  let response: Response
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    Sentry.logger.error('API request failed', { endpoint, path: url.pathname, reason: String(error) })
    throw new CatalogUnavailableError(`Каталог недоступний: ${url.pathname}`, { cause: error })
  }
  const duration = performance.now() - started
  Sentry.metrics.distribution('api.request.duration', duration, {
    unit: 'millisecond',
    attributes: { endpoint, status: response.status },
  })
  if (response.status === 404) throw new NotFoundError(url.pathname)
  if (!response.ok) {
    Sentry.logger.error('API responded with an error', { endpoint, path: url.pathname, status: response.status })
    throw new CatalogUnavailableError(`Каталог відповів ${response.status}: ${url.pathname}`)
  }
  if (duration > SLOW_MS) Sentry.logger.warn('Slow API request', { endpoint, path: url.pathname, duration_ms: Math.round(duration) })
  return (await response.json()) as T
}
