'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(max-width: 999.98px)'

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/** Чи показано мобільну верстку: до 1000px, як у mini.css. */
export function useMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}
