'use client'

import Link from 'next/link'

import { BellIcon, CheckIcon } from '@/components/icons'

import { useWatch, WATCH_LIMIT_TEXT } from './WatchProvider'

/** Кнопка стеження в панелі покупки на десктопі: стан і підказка, куди прийде сповіщення. */
export function WatchButton({ prominent, appear }: { prominent: boolean; appear: boolean }) {
  const watch = useWatch()
  if (!watch) return null
  const on = watch.watching === true
  const label = on ? 'Відстежується' : appear ? "Повідомити, коли з'явиться" : 'Стежити за ціною'
  return (
    <>
      <button
        type="button"
        className={`button watch-button${prominent ? ' button--outline' : ' button--ghost'}${on ? ' is-on' : ''}`}
        aria-pressed={on}
        disabled={watch.busy}
        onClick={watch.toggle}
      >
        {on ? <CheckIcon size={14} /> : <BellIcon size={16} />}
        {label}
      </button>
      {watch.notice === 'limit' ? (
        <p className="watch-note watch-note--error">
          {WATCH_LIMIT_TEXT}. <Link href="/price-alerts">Стежу за ціною</Link>
        </p>
      ) : watch.notice === 'failed' ? (
        <p className="watch-note watch-note--error">Не вдалося змінити стеження. Спробуйте ще раз.</p>
      ) : on ? (
        <p className="watch-note">Сповіщення прийде в Telegram від @{watch.bot}</p>
      ) : null}
    </>
  )
}
