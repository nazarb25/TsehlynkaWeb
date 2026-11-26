import 'server-only'

import { redirect } from 'next/navigation'

import { getProfile, type Profile } from '@/lib/api/account'

import { sessionToken } from './session'

export interface PersonalSession {
  session: string
  profile: Profile
}

/** Сесія й профіль для особистого екрана; без входу — `null`, відхилена сесія — через очищення cookie. */
export async function personalSession(path: string): Promise<PersonalSession | null> {
  const session = await sessionToken()
  if (!session) return null
  const profile = await getProfile(session)
  if (!profile) redirect(`/auth/session?next=${encodeURIComponent(path)}`)
  return { session, profile }
}
