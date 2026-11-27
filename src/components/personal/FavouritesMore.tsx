'use client'

import { useState } from 'react'

import { useFavourites } from '@/components/favourites/FavouritesProvider'
import { PersonalRow } from '@/components/mini/SetRows'
import type { Page, SetItem } from '@/lib/api/types'
import { useRestorableList } from '@/lib/platform/restorable-list'

/**
 * «Показати ще» в «Обраному»: наступні сторінки дописуються в той самий список.
 * Прибрані з обраного набори зсувають список в API, тому зсув рахується без них, а повтори відкидаються.
 */
export function FavouritesMore({ shown, total, grid }: { shown: string[]; total: number; grid: boolean }) {
  const { state: favourite } = useFavourites()
  const [{ items, remaining }, setList] = useRestorableList<{ items: SetItem[]; remaining: boolean }>('favourites', {
    items: [],
    remaining: total > shown.length,
  })
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')

  const load = async () => {
    setState('loading')
    const loaded = [...shown, ...items.map((item) => item.id)]
    const removed = loaded.filter((id) => favourite(id) === false).length
    try {
      const response = await fetch(`/api/me/favourites/page?offset=${Math.max(loaded.length - removed, 0)}`)
      if (!response.ok) throw new Error(String(response.status))
      const page = (await response.json()) as Page<SetItem>
      const seen = new Set(loaded)
      const fresh = page.items.filter((item) => !seen.has(item.id))
      setList((value) => ({ items: [...value.items, ...fresh], remaining: page.items.length > 0 && page.offset + page.items.length < page.total }))
      setState('idle')
    } catch {
      setState('error')
    }
  }

  return (
    <>
      {items.map((item) => (
        <PersonalRow key={item.id} item={item} selected grid={grid} />
      ))}
      {remaining ? (
        <button type="button" className="c-more" onClick={load} disabled={state === 'loading'}>
          {state === 'loading' ? 'Завантажуємо…' : state === 'error' ? 'Не вдалося. Спробувати ще' : 'Показати ще'}
        </button>
      ) : null}
    </>
  )
}
