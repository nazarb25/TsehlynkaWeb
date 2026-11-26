'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ConfirmSheet } from './ConfirmSheet'

/** «Очистити історію» з підтвердженням, як у Mini App. */
export function ClearRecent() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const clear = async () => {
    setBusy(true)
    const response = await fetch('/api/me/recent', { method: 'DELETE' }).catch(() => null)
    setBusy(false)
    if (response?.ok) {
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <>
      <button type="button" className="c-wide-button c-wide-button--danger" onClick={() => setOpen(true)}>
        Очистити історію
      </button>
      <ConfirmSheet
        open={open}
        title="Видалити історію переглядів?"
        text="Відновити її не вдасться. Обране залишиться."
        action="Видалити"
        busy={busy}
        onConfirm={clear}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
