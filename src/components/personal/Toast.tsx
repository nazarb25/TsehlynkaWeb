'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const VISIBLE_MS = 2500

/** Спливне повідомлення, як у Mini App. */
export function useToast(): [React.ReactNode, (text: string) => void] {
  const [text, setText] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  const show = useCallback((value: string) => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    setText(value)
    timer.current = window.setTimeout(() => setText(null), VISIBLE_MS)
  }, [])

  useEffect(() => () => (timer.current === null ? undefined : window.clearTimeout(timer.current)), [])

  const node = (
    <div className={`c-toast${text ? ' is-visible' : ''}`} role="status" aria-live="polite" hidden={!text}>
      {text}
    </div>
  )
  return [node, show]
}
