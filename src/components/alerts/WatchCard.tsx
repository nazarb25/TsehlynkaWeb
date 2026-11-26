'use client'

import Link from 'next/link'

import { price as formatPrice } from '@/lib/format'

import { BellIcon } from './WatchRow'
import { useWatch, WATCH_LIMIT_TEXT } from './WatchProvider'

interface WatchCardProps {
  /** `panel` — картка в панелі покупки, `offers` — блок під таблицею «Де купити». */
  place: 'panel' | 'offers'
  /** Найнижча ціна в наявності: нижче за неї надійде сповіщення. */
  price: number | null
  /** Набору немає в продажу: стеження чекає появи. */
  appear: boolean
}

function hint(place: WatchCardProps['place'], on: boolean, amount: string, appear: boolean, bot: string): string {
  if (on) return amount ? `Напишемо в Telegram від @${bot}, коли стане дешевше` : `Напишемо в Telegram від @${bot}, коли з'явиться в наявності`
  if (appear) return `Напишемо в Telegram, коли набір з'явиться в українських магазинах`
  if (!amount) return "Напишемо в Telegram, коли з'явиться в наявності"
  return place === 'offers'
    ? `Повідомимо в Telegram, щойно хтось із магазинів знизить ціну нижче ${amount}`
    : `Напишемо в Telegram, коли стане дешевше за ${amount}`
}

/** Стеження за ціною на десктопній сторінці набору; обидва місця беруть стан з одного `WatchProvider`. */
export function WatchCard({ place, price, appear }: WatchCardProps) {
  const watch = useWatch()
  if (!watch) return null
  const on = watch.watching === true
  const amount = price === null ? '' : formatPrice(price)
  const title = on ? 'Відстежується' : appear ? "Повідомити, коли з'явиться" : place === 'offers' ? 'Чекаєте на знижку?' : 'Стежити за ціною'
  return (
    <div className={`watch-card watch-card--${place}${on ? ' is-on' : ''}${appear ? ' watch-card--appear' : ''}`}>
      <div className="watch-card__row">
        <span className="watch-card__icon" aria-hidden="true">
          <BellIcon />
        </span>
        <span className="watch-card__text">
          <b>{title}</b>
          <span>{hint(place, on, amount, appear, watch.bot)}</span>
        </span>
        <button
          type="button"
          className={`watch-switch${on ? ' is-on' : ''}`}
          role="switch"
          aria-checked={on}
          aria-label={appear ? "Повідомити, коли набір з'явиться в продажу" : 'Стежити за ціною'}
          disabled={watch.busy}
          onClick={watch.toggle}
        />
      </div>
      {watch.notice === 'limit' ? (
        <p className="watch-card__error">
          {WATCH_LIMIT_TEXT}. <Link href="/price-alerts">Стежу за ціною</Link>
        </p>
      ) : watch.notice === 'failed' ? (
        <p className="watch-card__error">Не вдалося змінити стеження. Спробуйте ще раз.</p>
      ) : null}
    </div>
  )
}
