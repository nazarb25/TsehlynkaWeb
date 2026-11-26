'use client'

import { useEffect } from 'react'

import { useAuth } from '@/components/auth/AuthProvider'

/** Записати перегляд набору в історію, коли користувач увійшов. */
export function RecordView({ setId }: { setId: string }) {
  const { account } = useAuth()
  useEffect(() => {
    if (account) void fetch(`/api/me/recent/${encodeURIComponent(setId)}`, { method: 'POST' }).catch(() => {})
  }, [account, setId])
  return null
}
