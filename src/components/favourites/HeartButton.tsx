'use client'

import { useFavourite } from './FavouritesProvider'

export function HeartIcon({ size = 22, width = 1.8, filled = true }: { size?: number; width?: number; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={width}
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  )
}

interface HeartButtonProps {
  setId: string
  name: string
  /** Відомий стан, наприклад у списку «Обране»; без нього стан підтягується з API. */
  initial?: boolean
  variant?: 'row' | 'media' | 'tile'
}

/** Сердечко обраного: без входу відкриває вхід і зберігає набір після нього. */
export function HeartButton({ setId, name, initial, variant = 'row' }: HeartButtonProps) {
  const { selected, toggle } = useFavourite(setId, initial)
  const base = variant === 'media' ? 'c-set-media__fav' : variant === 'tile' ? 'tile__fav' : 'c-uact'
  return (
    <button type="button" className={`${base}${selected ? ' is-selected' : ''}`} aria-pressed={selected} aria-label={`Обране: ${name}`} onClick={toggle}>
      {variant === 'media' ? (
        <HeartIcon size={20} width={2} filled={false} />
      ) : variant === 'tile' ? (
        <HeartIcon size={18} width={2} filled={false} />
      ) : (
        <HeartIcon />
      )}
    </button>
  )
}
