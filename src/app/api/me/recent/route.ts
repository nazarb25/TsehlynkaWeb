import { clearRecent } from '@/lib/api/account'
import { noContent, withSession } from '@/lib/auth/route'

/** Очистити історію переглядів. */
export function DELETE(request: Request) {
  return withSession(
    request,
    async (session) => {
      return (await clearRecent(session)) ? noContent() : null
    },
    { mutates: true },
  )
}
