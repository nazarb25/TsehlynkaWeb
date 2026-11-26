import 'server-only'

import { createHash, randomBytes } from 'node:crypto'

import * as Sentry from '@sentry/nextjs'

import { siteUrl } from '@/lib/site'

const AUTHORIZE_URL = 'https://oauth.telegram.org/auth'
const TOKEN_URL = 'https://oauth.telegram.org/token'
const SCOPE = 'openid profile telegram:bot_access'
const TIMEOUT_MS = 8000

/** Cookie з `state`, PKCE і адресою повернення на час входу. */
export const OAUTH_COOKIE = 'ts_oauth'
export const OAUTH_MAX_AGE = 600

export interface TelegramClient {
  id: string
  secret: string
}

/** Client ID і Client Secret з BotFather; без них вхід через Telegram вимкнено. */
export function telegramClient(): TelegramClient | null {
  const id = process.env.TELEGRAM_CLIENT_ID?.trim()
  const secret = process.env.TELEGRAM_CLIENT_SECRET?.trim()
  return id && secret ? { id, secret } : null
}

export function redirectUri(): string {
  return `${siteUrl()}/auth/telegram/callback`
}

function base64url(buffer: Buffer): string {
  return buffer.toString('base64url')
}

export interface AuthorizationRequest {
  url: string
  state: string
  verifier: string
}

/** Адреса входу Telegram з `state` і PKCE (S256). */
export function authorizationRequest(client: TelegramClient): AuthorizationRequest {
  const state = base64url(randomBytes(24))
  const verifier = base64url(randomBytes(48))
  const challenge = base64url(createHash('sha256').update(verifier).digest())
  const url = new URL(AUTHORIZE_URL)
  url.search = new URLSearchParams({
    client_id: client.id,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: SCOPE,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  }).toString()
  return { url: url.toString(), state, verifier }
}

/** Обміняти код на `id_token`; секрет клієнта лишається на сервері. */
export async function exchangeCode(client: TelegramClient, code: string, verifier: string): Promise<string | null> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${client.id}:${client.secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      client_id: client.id,
      code_verifier: verifier,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  const body = (await response.json().catch(() => ({}))) as { id_token?: unknown; error?: unknown; error_description?: unknown }
  if (response.ok && typeof body.id_token === 'string') return body.id_token
  Sentry.logger.warn('Telegram token exchange rejected', {
    status: response.status,
    error: typeof body.error === 'string' ? body.error : null,
    description: typeof body.error_description === 'string' ? body.error_description : null,
  })
  return null
}
