import { recordView } from '@/lib/api/account'
import { noContent, withSession } from '@/lib/auth/route'

/** Записати перегляд набору в «Нещодавно переглянуті». */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return withSession(
    request,
    async (session) => {
      await recordView(session, id)
      return noContent()
    },
    { mutates: true },
  )
}
