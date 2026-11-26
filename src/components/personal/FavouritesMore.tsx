'use client'

import { useState } from 'react'

import { PersonalRow } from '@/components/mini/SetRows'
import type { Page, SetItem } from '@/lib/api/types'

/** «Показати ще» в «Обраному»: наступні сторінки дописуються в той самий список. */
export function FavouritesMore({ offset, total, grid }: { offset: number; total: number; grid: boolean }) {
  const [items, setItems] = useState<SetItem[]>([])
  const [next, setNext] = useState(offset)
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')

  const load = async () => {
    setState('loading')
    try {
      const response = await fetch(`/api/me/favourites/page?offset=${next}`)
      if (!response.ok) throw new Error(String(response.status))
      const page = (await response.json()) as Page<SetItem>
      setItems((value) => [...value, ...page.items])
      setNext(next + page.items.length)
      setState(page.items.length ? 'idle' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <>
      {items.map((item) => (
        <PersonalRow key={item.id} item={item} selected grid={grid} />
      ))}
      {next < total ? (
        <button type="button" className="c-more" onClick={load} disabled={state === 'loading'}>
          {state === 'loading' ? 'Завантажуємо…' : state === 'error' ? 'Не вдалося. Спробувати ще' : 'Показати ще'}
        </button>
      ) : null}
    </>
  )
}
