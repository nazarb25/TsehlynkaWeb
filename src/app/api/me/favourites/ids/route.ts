import { NextResponse, type NextRequest } from 'next/server'

import { favouriteIds } from '@/lib/api/account'
import { withSession } from '@/lib/auth/route'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Які з наборів сторінки є в обраному. */
export function GET(request: NextRequest) {
  const ids = [...new Set(request.nextUrl.searchParams.getAll('set_id').filter((id) => UUID.test(id)))].slice(0, 100)
  return withSession(
    request,
    async (session) => {
      const stored = await favouriteIds(session, ids)
      return stored ? NextResponse.json({ set_ids: stored }, { headers: { 'Cache-Control': 'private, no-store' } }) : null
    },
    { mutates: false },
  )
}
