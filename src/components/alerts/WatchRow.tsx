'use client'

import { useEffect } from 'react'

import { useToast } from '@/components/personal/Toast'

import { useWatch, WATCH_LIMIT_TEXT } from './WatchProvider'

export function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10 20a2 2 0 0 0 4 0" fill="none" />
    </svg>
  )
}

/** Перемикач стеження на мобільній сторінці набору, як у Mini App. */
export function WatchRow({ place }: { place: 'price' | 'appear' }) {
  const watch = useWatch()
  const [toast, showToast] = useToast()
  const notice = watch?.notice ?? null
  const bot = watch?.bot ?? ''

  useEffect(() => {
    if (notice === 'started') showToast(`Готово. Сповіщення прийде в Telegram від @${bot}`)
    else if (notice === 'limit') showToast(WATCH_LIMIT_TEXT)
    else if (notice === 'failed') showToast('Не вдалося змінити стеження. Спробуйте ще раз')
  }, [bot, notice, showToast])

  if (!watch) return null
  const on = watch.watching === true
  return (
    <div className={`c-watch c-watch--${place}`}>
      <div className="c-watch__row">
        <span className="c-watch__icon" aria-hidden="true">
          <BellIcon />
        </span>
        <span className="c-watch__label">{on ? 'Відстежується' : place === 'appear' ? "Повідомити, коли з'явиться" : 'Стежити за ціною'}</span>
        <button
          type="button"
          className={`c-switch${on ? ' is-on' : ''}${watch.busy ? ' is-busy' : ''}`}
          role="switch"
          aria-checked={on}
          aria-label={place === 'appear' ? "Повідомити, коли набір з'явиться в продажу" : 'Стежити за ціною'}
          onClick={watch.toggle}
        />
      </div>
      <p className="c-watch__note">
        {place === 'appear'
          ? `Бот @${bot} напише в Telegram, коли набір з'явиться в українських магазинах.`
          : `Бот @${bot} повідомить у Telegram про зниження ціни або повернення набору в наявність.`}
      </p>
      {toast}
    </div>
  )
}
