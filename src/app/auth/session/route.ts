import * as Sentry from '@sentry/nextjs'
import { NextResponse, type NextRequest } from 'next/server'

import { getProfile } from '@/lib/api/account'
import { clearSession, safeNext, sessionToken } from '@/lib/auth/session'
import { absoluteUrl } from '@/lib/site'

function login(next: string, error: string): NextResponse {
  return NextResponse.redirect(absoluteUrl(`/login?error=${error}&next=${encodeURIComponent(next)}`))
}

/** Сесію, яку API більше не приймає, прибрати з cookie й відкрити вхід; чинна сесія веде далі. */
export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get('next'))
  const token = await sessionToken()
  let valid = false
  try {
    valid = token !== null && (await getProfile(token)) !== null
  } catch (error) {
    Sentry.captureException(error)
    return login(next, 'unavailable')
  }
  if (valid) return NextResponse.redirect(absoluteUrl(next))
  const response = login(next, 'ended')
  clearSession(response)
  return response
}
