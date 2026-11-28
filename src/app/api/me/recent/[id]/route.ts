import { NextResponse } from 'next/server'

import { AccountUnavailableError, recordView } from '@/lib/api/account'
import { noContent, withSession } from '@/lib/auth/route'

/** Записати перегляд набору в «Нещодавно переглянуті»; недоступний API лише пропускає запис. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return withSession(
    request,
    async (session) => {
      try {
        return (await recordView(session, id)) ? noContent() : null
      } catch (error) {
        if (error instanceof AccountUnavailableError) return NextResponse.json({ error: 'unavailable' }, { status: 503 })
        throw error
      }
    },
    { mutates: true },
  )
}
