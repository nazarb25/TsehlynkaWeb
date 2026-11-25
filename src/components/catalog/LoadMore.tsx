'use client'

import { useState } from 'react'

import type { SetItem } from '@/lib/api/types'
import type { SectionKey } from '@/lib/catalog/filters'

import { SetTile, type TileContext } from './SetTile'

interface LoadMoreProps {
  sectionKey: SectionKey
  query: string
  page: number
  pages: number
  context: TileContext
  view: 'grid' | 'list' | 'auto'
  end?: React.ReactNode
}

/** «Показати ще»: наступні сторінки дописуються під поточною, адреса не змінюється; `end` — під останньою сторінкою. */
export function LoadMore({ sectionKey, query, page, pages, context, view, end }: LoadMoreProps) {
  const [items, setItems] = useState<SetItem[]>([])
  const [next, setNext] = useState(page + 1)
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')

  if (next > pages && !items.length) return end ?? null

  const load = async () => {
    setState('loading')
    const params = new URLSearchParams(query)
    params.set('page', String(next))
    params.set('section', sectionKey)
    try {
      const response = await fetch(`/api/sets?${params}`)
      if (!response.ok) throw new Error(String(response.status))
      const body = (await response.json()) as { items: SetItem[] }
      setItems((value) => [...value, ...body.items])
      setNext((value) => value + 1)
      setState('idle')
    } catch {
      setState('error')
    }
  }

  return (
    <>
      {items.length ? (
        <div className={`tiles tiles--${view} tiles--c4 tiles--more`}>
          {items.map((set) => (
            <SetTile key={set.id} set={set} context={context} />
          ))}
        </div>
      ) : null}
      {next <= pages ? (
        <div className="more">
          <button type="button" className="button button--surface" onClick={load} disabled={state === 'loading'}>
            {state === 'loading' ? 'Завантажуємо…' : state === 'error' ? 'Не вдалося. Спробувати ще' : 'Показати ще'}
          </button>
        </div>
      ) : (
        end
      )}
    </>
  )
}
