'use client'

import { useEffect, useRef } from 'react'

import { MiniSheet } from '@/components/mini/MiniSheet'
import { useMobile } from '@/components/mini/useMobile'

import { LoginPanel } from './LoginPanel'

/** Вікно входу поверх сторінки: на телефоні шторка знизу, на десктопі діалог по центру. */
export function LoginDialog({ next, onClose }: { next: string | null; onClose: () => void }) {
  const mobile = useMobile()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const open = next !== null

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || mobile) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open, mobile])

  if (mobile) {
    return (
      <MiniSheet open={open} label="Вхід" onClose={onClose}>
        {next !== null ? <LoginPanel next={next} /> : null}
      </MiniSheet>
    )
  }
  return (
    <dialog
      ref={dialogRef}
      className="login-dialog"
      aria-labelledby="login-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <button type="button" className="login-dialog__close" aria-label="Закрити" onClick={onClose}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
      {next !== null ? <LoginPanel next={next} titleId="login-title" /> : null}
    </dialog>
  )
}
