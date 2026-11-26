import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

import { closeSession } from '@/lib/api/account'
import { clearSession, sameOrigin, sessionToken } from '@/lib/auth/session'
import { absoluteUrl } from '@/lib/site'

/** Вихід: скасувати сесію в API й прибрати cookie; форма повертає на головну. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const token = await sessionToken()
  if (token) {
    try {
      await closeSession(token)
    } catch (error) {
      Sentry.captureException(error)
    }
  }
  const response = NextResponse.redirect(absoluteUrl('/'), 303)
  clearSession(response)
  return response
}
