'use client'

import { useEffect, useRef, useState } from 'react'

import { TileIcon } from './icons'
import { useToast } from './Toast'

const COPY = 'M9 9h10v10H9zM5 15V5h10'
const DONE = 'M5 12.5l4.5 4.5L19 7.5'
const DONE_MS = 2000

/** Кругла кнопка «Копіювати» поруч із контактом. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false)
  const [toast, showToast] = useToast()
  const timer = useRef<number | null>(null)

  useEffect(() => () => (timer.current === null ? undefined : window.clearTimeout(timer.current)), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      showToast('Не вдалося скопіювати')
      return
    }
    setDone(true)
    showToast('Скопійовано')
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDone(false), DONE_MS)
  }

  return (
    <>
      <button type="button" className={`contacts__copy${done ? ' is-done' : ''}`} aria-label={label} title="Копіювати" onClick={copy}>
        <TileIcon path={done ? DONE : COPY} />
      </button>
      <div className="c-desk c-toast-host">{toast}</div>
    </>
  )
}
