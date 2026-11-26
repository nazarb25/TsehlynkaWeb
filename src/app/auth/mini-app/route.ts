import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

import { getProfile, openMiniAppSession } from '@/lib/api/account'
import { sameOrigin, storeSession } from '@/lib/auth/session'

const INIT_DATA_LIMIT = 8192

/** Автоматичний вхід у Mini App: init data від Telegram → сесія сайту. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  let initData: unknown
  try {
    initData = ((await request.json()) as { initData?: unknown }).initData
  } catch {
    initData = null
  }
  if (typeof initData !== 'string' || !initData || initData.length > INIT_DATA_LIMIT) {
    return NextResponse.json({ error: 'invalid_init_data' }, { status: 400 })
  }
  try {
    const session = await openMiniAppSession(initData)
    const profile = session ? await getProfile(session.token) : null
    if (!session || !profile) return NextResponse.json({ error: 'invalid_init_data' }, { status: 401 })
    const response = new NextResponse(null, { status: 204 })
    storeSession(response, session, profile)
    return response
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}
