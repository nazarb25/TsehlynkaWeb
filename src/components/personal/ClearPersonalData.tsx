'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ConfirmSheet } from './ConfirmSheet'
import { useToast } from './Toast'

/** «Видалити всі особисті дані» з підтвердженням. */
export function ClearPersonalData() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, showToast] = useToast()

  const clear = async () => {
    setBusy(true)
    const response = await fetch('/api/me/personal-data', { method: 'DELETE' }).catch(() => null)
    setBusy(false)
    setOpen(false)
    showToast(response?.ok ? 'Особисті дані видалено' : 'Не вдалося видалити особисті дані')
    if (response?.ok) router.refresh()
  }

  return (
    <>
      <div className="c-list c-list--plain">
        <button type="button" className="c-list__row c-list__row--danger" onClick={() => setOpen(true)}>
          Видалити всі особисті дані
        </button>
      </div>
      <p className="c-list__note">Буде очищено email, телефон і дату народження. Обране й історія залишаться.</p>
      <ConfirmSheet
        open={open}
        title="Видалити особисті дані?"
        text="Буде очищено електронну пошту, телефон і дату народження."
        action="Видалити"
        busy={busy}
        onConfirm={clear}
        onClose={() => setOpen(false)}
      />
      {toast}
    </>
  )
}
