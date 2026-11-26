'use client'

import { useState } from 'react'

import { useAuth } from '@/components/auth/AuthProvider'
import { isOnSale, SetRow } from '@/components/mini/SetRows'
import { useToast } from '@/components/personal/Toast'
import type { PriceAlert } from '@/lib/api/account'
import type { Page } from '@/lib/api/types'
import { price } from '@/lib/format'

import { WATCH_LIMIT_TEXT } from './WatchProvider'

function BellGlyph({ filled }: { filled: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10 20a2 2 0 0 0 4 0" fill="none" />
    </svg>
  )
}

/** Поточний продаж набору: ціна в наявності, передзамовлення або «Немає в продажу». */
function AlertPrice({ item }: { item: PriceAlert }) {
  if (isOnSale(item))
    return (
      <>
        <b>{price(item.min_in_stock_price)}</b> · <span className="is-ok">в наявності</span>
      </>
    )
  if (item.has_preorder_offer)
    return (
      <>
        {item.min_preorder_price !== null && item.min_preorder_price !== undefined ? (
          <>
            <b>{price(item.min_preorder_price)}</b> ·{' '}
          </>
        ) : null}
        <span className="is-pre">передзамовлення</span>
      </>
    )
  return <>Немає в продажу</>
}

/** Умова сповіщення: дешевше за ціну підписки чи поява в наявності або в продажу. */
function alertNote(item: PriceAlert): string {
  if (item.baseline_price !== null) return `Повідомимо, якщо стане дешевше за ${price(item.baseline_price)}`
  if (item.has_preorder_offer && !isOnSale(item)) return "Повідомимо, коли з'явиться в наявності"
  return "Повідомимо, коли з'явиться в продажу"
}

/**
 * Список «Стежу за ціною»: дзвіночок вимикає й вмикає стеження без зникнення рядка.
 * «Показати ще» рахує зсув без вимкнених стежень, бо вони зникають зі списку в API.
 */
export function AlertsList({ initial, total }: { initial: PriceAlert[]; total: number }) {
  const { openLogin } = useAuth()
  const [items, setItems] = useState(initial)
  const [off, setOff] = useState<ReadonlySet<string>>(new Set())
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set())
  const [remaining, setRemaining] = useState(total > initial.length)
  const [loading, setLoading] = useState<'idle' | 'loading' | 'error'>('idle')
  const [toast, showToast] = useToast()

  const mark = (setter: typeof setOff, id: string, present: boolean) =>
    setter((value) => {
      const next = new Set(value)
      if (present) next.add(id)
      else next.delete(id)
      return next
    })

  const toggle = async (item: PriceAlert) => {
    if (busy.has(item.id)) return
    const watching = off.has(item.id)
    mark(setBusy, item.id, true)
    try {
      const response = await fetch(`/api/me/price-alerts/${item.id}`, { method: watching ? 'PUT' : 'DELETE' })
      if (response.status === 204) {
        mark(setOff, item.id, !watching)
        showToast(watching ? 'Стеження повернуто' : 'Більше не стежимо за ціною')
      } else if (response.status === 401) openLogin()
      else showToast(response.status === 409 ? WATCH_LIMIT_TEXT : 'Не вдалося змінити стеження. Спробуйте ще раз')
    } catch {
      showToast('Не вдалося змінити стеження. Спробуйте ще раз')
    } finally {
      mark(setBusy, item.id, false)
    }
  }

  const more = async () => {
    setLoading('loading')
    try {
      const response = await fetch(`/api/me/price-alerts/page?offset=${Math.max(items.length - off.size, 0)}`)
      if (!response.ok) throw new Error(String(response.status))
      const page = (await response.json()) as Page<PriceAlert>
      const seen = new Set(items.map((item) => item.id))
      setItems((value) => [...value, ...page.items.filter((item) => !seen.has(item.id))])
      setRemaining(page.items.length > 0 && page.offset + page.items.length < page.total)
      setLoading('idle')
    } catch {
      setLoading('error')
    }
  }

  return (
    <>
      <div className="c-urows">
        {items.map((item) => {
          const on = !off.has(item.id)
          return (
            <SetRow
              key={item.id}
              item={item}
              price={<AlertPrice item={item} />}
              note={on ? alertNote(item) : 'Стеження вимкнено'}
              action={
                <button
                  type="button"
                  className={`c-uact${on ? ' is-on' : ''}`}
                  aria-pressed={on}
                  aria-label={on ? `Не стежити за «${item.name}»` : `Стежити за «${item.name}»`}
                  disabled={busy.has(item.id)}
                  onClick={() => void toggle(item)}
                >
                  <BellGlyph filled={on} />
                </button>
              }
            />
          )
        })}
        {remaining ? (
          <button type="button" className="c-more" onClick={more} disabled={loading === 'loading'}>
            {loading === 'loading' ? 'Завантажуємо…' : loading === 'error' ? 'Не вдалося. Спробувати ще' : 'Показати ще'}
          </button>
        ) : null}
      </div>
      {toast}
    </>
  )
}
