import * as Sentry from '@sentry/nextjs'
import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'

import { getProfile, openTelegramSession } from '@/lib/api/account'
import { safeNext, storeSession } from '@/lib/auth/session'
import { exchangeCode, OAUTH_COOKIE, telegramClient } from '@/lib/auth/telegram'
import { absoluteUrl } from '@/lib/site'

interface PendingLogin {
  state: string
  verifier: string
  next: string
}

function pending(raw: string | undefined): PendingLogin | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<PendingLogin>
    if (typeof value.state !== 'string' || typeof value.verifier !== 'string') return null
    return { state: value.state, verifier: value.verifier, next: safeNext(value.next) }
  } catch {
    return null
  }
}

function sameState(expected: string, received: string): boolean {
  const a = Buffer.from(expected)
  const b = Buffer.from(received)
  return a.length === b.length && timingSafeEqual(a, b)
}

function failed(next: string, reason: string): NextResponse {
  const response = NextResponse.redirect(absoluteUrl(`/login?error=${reason}&next=${encodeURIComponent(next)}`))
  response.cookies.delete({ name: OAUTH_COOKIE, path: '/auth/telegram' })
  return response
}

/** Повернення з Telegram: перевірка `state`, обмін коду на сервері, сесія в API і cookie. */
export async function GET(request: NextRequest) {
  const login = pending(request.cookies.get(OAUTH_COOKIE)?.value)
  const params = request.nextUrl.searchParams
  const code = params.get('code')
  const state = params.get('state')
  if (!login) return failed('/', 'expired')
  if (params.get('error')) return failed(login.next, 'cancelled')
  if (!code || !state || !sameState(login.state, state)) return failed(login.next, 'expired')
  const client = telegramClient()
  if (!client) return failed(login.next, 'unavailable')

  try {
    const idToken = await exchangeCode(client, code, login.verifier)
    const session = idToken ? await openTelegramSession(idToken) : null
    const profile = session ? await getProfile(session.token) : null
    if (!session || !profile) return failed(login.next, 'rejected')
    const response = NextResponse.redirect(absoluteUrl(login.next))
    response.cookies.delete({ name: OAUTH_COOKIE, path: '/auth/telegram' })
    storeSession(response, session, profile)
    return response
  } catch (error) {
    Sentry.captureException(error)
    return failed(login.next, 'unavailable')
  }
}
