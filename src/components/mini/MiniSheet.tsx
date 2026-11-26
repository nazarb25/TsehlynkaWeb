'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const HIDE_FALLBACK_MS = 400

interface MiniSheetProps {
  open: boolean
  label: string
  onClose: () => void
  children: React.ReactNode
}

/** Шторка знизу, як у Mini App: виїжджає з-під краю екрана, закривається тапом по тлі чи Escape. */
export function MiniSheet({ open, label, onClose, children }: MiniSheetProps) {
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)
  const panelRef = useRef<HTMLElement>(null)

  if (open && !mounted) setMounted(true)
  if (!open && shown) setShown(false)

  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => setMounted(false), HIDE_FALLBACK_MS)
      return () => window.clearTimeout(timer)
    }
    const frame = window.requestAnimationFrame(() => {
      void panelRef.current?.offsetHeight
      setShown(true)
    })
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.classList.add('is-sheet-open')
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = overflow
      document.body.classList.remove('is-sheet-open')
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!mounted) return null
  return createPortal(
    <div className={`c-sheet${shown ? ' is-open' : ''}`}>
      <div className="c-sheet__backdrop" onClick={onClose} />
      <section ref={panelRef} className="c-sheet__panel" aria-label={label} role="dialog" aria-modal="true">
        <div className="c-sheet__handle" aria-hidden="true" />
        <div className="c-sheet__body">{children}</div>
      </section>
    </div>,
    document.body,
  )
}
