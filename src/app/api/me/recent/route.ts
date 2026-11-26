import { clearRecent } from '@/lib/api/account'
import { noContent, withSession } from '@/lib/auth/route'

/** Очистити історію переглядів. */
export function DELETE(request: Request) {
  return withSession(
    request,
    async (session) => {
      await clearRecent(session)
      return noContent()
    },
    { mutates: true },
  )
}
