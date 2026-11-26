import { NextResponse, type NextRequest } from 'next/server'

import { safeNext, secureCookies } from '@/lib/auth/session'
import { authorizationRequest, OAUTH_COOKIE, OAUTH_MAX_AGE, telegramClient } from '@/lib/auth/telegram'
import { absoluteUrl } from '@/lib/site'

/** Початок входу: `state`, PKCE і адреса повернення в короткій cookie, далі сторінка Telegram. */
export function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get('next'))
  const client = telegramClient()
  if (!client) return NextResponse.redirect(absoluteUrl(`/login?error=unavailable&next=${encodeURIComponent(next)}`))
  const { url, state, verifier } = authorizationRequest(client)
  const response = NextResponse.redirect(url)
  response.cookies.set(OAUTH_COOKIE, JSON.stringify({ state, verifier, next }), {
    httpOnly: true,
    secure: secureCookies(),
    sameSite: 'lax',
    path: '/auth/telegram',
    maxAge: OAUTH_MAX_AGE,
  })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
