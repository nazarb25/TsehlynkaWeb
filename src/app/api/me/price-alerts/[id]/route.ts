import { NextResponse } from 'next/server'

import { isWatchingPrice, setPriceAlert } from '@/lib/api/account'
import { noContent, withSession } from '@/lib/auth/route'

interface Context {
  params: Promise<{ id: string }>
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function toggle(request: Request, { params }: Context, watching: boolean): Promise<NextResponse> {
  const { id } = await params
  if (!UUID.test(id)) return NextResponse.json({ error: 'invalid' }, { status: 422 })
  return withSession(request, async (session) => ((await setPriceAlert(session, id, watching)) ? noContent() : null), { mutates: true })
}

/** Чи стежить користувач за ціною набору. */
export async function GET(request: Request, { params }: Context) {
  const { id } = await params
  if (!UUID.test(id)) return NextResponse.json({ error: 'invalid' }, { status: 422 })
  return withSession(
    request,
    async (session) => {
      const watching = await isWatchingPrice(session, id)
      return watching === null ? null : NextResponse.json({ watching }, { headers: { 'Cache-Control': 'private, no-store' } })
    },
    { mutates: false },
  )
}

/** Стежити за ціною набору. */
export function PUT(request: Request, context: Context) {
  return toggle(request, context, true)
}

/** Не стежити за ціною набору. */
export function DELETE(request: Request, context: Context) {
  return toggle(request, context, false)
}
