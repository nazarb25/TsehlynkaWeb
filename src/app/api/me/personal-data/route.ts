import { NextResponse } from 'next/server'

import { clearPersonalData, updatePersonalData, type PersonalField } from '@/lib/api/account'
import { noContent, withSession } from '@/lib/auth/route'

const FIELDS: readonly PersonalField[] = ['email', 'phone', 'birth_date']

/** Змінити одне поле особистих даних; порожнє значення очищає його. */
export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as { field?: unknown; value?: unknown } | null
  const field = FIELDS.find((name) => name === body?.field)
  if (!field || (body?.value !== null && typeof body?.value !== 'string')) return NextResponse.json({ error: 'invalid' }, { status: 422 })
  const value = typeof body.value === 'string' && body.value.trim() ? body.value.trim() : null
  return withSession(
    request,
    async (session) => {
      const data = await updatePersonalData(session, field, value)
      return data ? NextResponse.json(data) : null
    },
    { mutates: true },
  )
}

/** Видалити всі особисті дані. */
export function DELETE(request: Request) {
  return withSession(
    request,
    async (session) => {
      await clearPersonalData(session)
      return noContent()
    },
    { mutates: true },
  )
}
