import { NextResponse } from 'next/server'

import { setFavourite } from '@/lib/api/account'
import { noContent, withSession } from '@/lib/auth/route'

interface Context {
  params: Promise<{ id: string }>
}

async function toggle(request: Request, { params }: Context, selected: boolean): Promise<NextResponse> {
  const { id } = await params
  return withSession(request, async (session) => ((await setFavourite(session, id, selected)) ? noContent() : null), { mutates: true })
}

/** Додати набір в обране. */
export function PUT(request: Request, context: Context) {
  return toggle(request, context, true)
}

/** Прибрати набір з обраного. */
export function DELETE(request: Request, context: Context) {
  return toggle(request, context, false)
}
