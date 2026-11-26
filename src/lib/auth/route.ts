import 'server-only'

import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

import { AccountRequestError } from '@/lib/api/account'

import { sameOrigin, sessionToken } from './session'

/**
 * Особистий запит сайту до API від імені сесії з cookie.
 * Без сесії чи з відхиленою сесією — 401; зміна стану приймається лише з цього сайту.
 */
export async function withSession(
  request: Request,
  action: (session: string) => Promise<NextResponse | null>,
  options: { mutates: boolean },
): Promise<NextResponse> {
  if (options.mutates && !sameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const session = await sessionToken()
  if (!session) return NextResponse.json({ error: 'session' }, { status: 401 })
  try {
    return (await action(session)) ?? NextResponse.json({ error: 'session' }, { status: 401 })
  } catch (error) {
    if (error instanceof AccountRequestError) return NextResponse.json({ error: 'rejected' }, { status: error.status })
    Sentry.captureException(error)
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}
