'use client'

import { useEffect, useRef } from 'react'

import { MiniSheet } from '@/components/mini/MiniSheet'
import { useMobile } from '@/components/mini/useMobile'

interface ConfirmSheetProps {
  open: boolean
  title: string
  text: string
  action: string
  busy: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Підтвердження незворотної дії: на телефоні шторка знизу, на десктопі діалог по центру. */
export function ConfirmSheet({ open, title, text, action, busy, onConfirm, onClose }: ConfirmSheetProps) {
  const mobile = useMobile()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || mobile) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open, mobile])

  const body = (
    <div className="c-confirm">
      <h2 className="c-confirm__title">{title}</h2>
      <p className="c-confirm__text">{text}</p>
      <button type="button" className="c-confirm__button c-confirm__button--danger" onClick={onConfirm} disabled={busy}>
        {action}
      </button>
      <button type="button" className="c-confirm__button" onClick={onClose}>
        Скасувати
      </button>
    </div>
  )

  if (mobile) {
    return (
      <MiniSheet open={open} label={title} onClose={onClose}>
        {body}
      </MiniSheet>
    )
  }
  return (
    <dialog
      ref={dialogRef}
      className="login-dialog confirm-dialog c-desk"
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      {body}
    </dialog>
  )
}
