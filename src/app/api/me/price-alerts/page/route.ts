import { NextResponse, type NextRequest } from 'next/server'

import { listPriceAlerts } from '@/lib/api/account'
import { withSession } from '@/lib/auth/route'

/** Наступна сторінка стежень для «Показати ще». */
export function GET(request: NextRequest) {
  const offset = Math.min(Math.max(Number(request.nextUrl.searchParams.get('offset')) || 0, 0), 10_000)
  return withSession(
    request,
    async (session) => {
      const page = await listPriceAlerts(session, offset)
      return page ? NextResponse.json(page, { headers: { 'Cache-Control': 'private, no-store' } }) : null
    },
    { mutates: false },
  )
}
