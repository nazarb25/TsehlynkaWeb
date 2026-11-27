'use client'

import { useState } from 'react'

import { useRestorableList } from '@/lib/platform/restorable-list'

import type { SetItem } from '@/lib/api/types'
import type { SectionKey } from '@/lib/catalog/filters'

import { CatalogRow, type RowContext } from './SetRows'

interface MiniLoadMoreProps {
  sectionKey: SectionKey
  query: string
  page: number
  pages: number
  context: RowContext
  grid: boolean
  end?: React.ReactNode
}

/** «Показати ще» мобільного вигляду: наступні сторінки дописуються в той самий список. */
export function MiniLoadMore({ sectionKey, query, page, pages, context, grid, end }: MiniLoadMoreProps) {
  const [{ items, next }, setList] = useRestorableList<{ items: SetItem[]; next: number }>('sets-mobile', { items: [], next: page + 1 })
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')

  const load = async () => {
    setState('loading')
    const params = new URLSearchParams(query)
    params.set('page', String(next))
    params.set('section', sectionKey)
    try {
      const response = await fetch(`/api/sets?${params}`)
      if (!response.ok) throw new Error(String(response.status))
      const body = (await response.json()) as { items: SetItem[] }
      setList((value) => ({ items: [...value.items, ...body.items], next: value.next + 1 }))
      setState('idle')
    } catch {
      setState('error')
    }
  }

  return (
    <>
      {items.map((item) => (
        <CatalogRow key={item.id} item={item} context={context} grid={grid} />
      ))}
      {next <= pages ? (
        <button type="button" className="c-more" onClick={load} disabled={state === 'loading'}>
          {state === 'loading' ? 'Завантажуємо…' : state === 'error' ? 'Не вдалося. Спробувати ще' : 'Показати ще'}
        </button>
      ) : (
        (end ?? <p className="c-end">Це всі набори за вашим запитом</p>)
      )}
    </>
  )
}
