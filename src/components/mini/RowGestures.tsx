'use client'

import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { WATCH_LIMIT_TEXT } from '@/components/alerts/WatchProvider'
import { useAuth } from '@/components/auth/AuthProvider'
import { useFavourite } from '@/components/favourites/FavouritesProvider'
import { useToast } from '@/components/personal/Toast'
import { track } from '@/lib/analytics'
import { telegramWebApp } from '@/lib/platform/telegram'

/**
 * Жести рядків набору, як у Mini App: свайп ліворуч відкриває дії з `data-swipe`, довгий натиск
 * на рядку чи картці — меню над затемненим списком. Лише в мобільному вигляді; свайпу праворуч
 * немає, бо в iOS він повертає назад.
 */

const MOBILE_LAYOUT = '(max-width: 999.98px)'
const SWIPE_ACTION_PX = 84
const SWIPE_START_PX = 10
const LONG_PRESS_MS = 450
const ROW = '[data-set-row]'
const HEART = '[data-favourite]'
const BELL = '[data-row-bell]'
/** Набір, за яким користувач хотів стежити зі списку до входу; стеження вмикається після входу. */
const PENDING_WATCH_KEY = 'ts_pending_row_watch'

function writePendingWatch(setId: string): void {
  try {
    window.sessionStorage.setItem(PENDING_WATCH_KEY, setId)
  } catch {}
}

function takePendingWatch(): string | null {
  try {
    const value = window.sessionStorage.getItem(PENDING_WATCH_KEY)
    window.sessionStorage.removeItem(PENDING_WATCH_KEY)
    return value
  } catch {
    return null
  }
}

/** `unwatch` і `rewatch` перемикають дзвіночок рядка в списку «Стежу за ціною». */
export type SwipeAction = 'fav' | 'watch' | 'offers' | 'unwatch' | 'rewatch'
type MenuAction = 'open' | 'offers' | 'fav' | 'watch' | 'bell' | 'share' | 'copy'

const ICONS = {
  open: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  offers: 'M5 9h14l-1.3 10.2a1 1 0 0 1-1 .8H7.3a1 1 0 0 1-1-.8zM9 9V7a3 3 0 0 1 6 0v2',
  fav: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  watch: 'M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0',
  unwatch: 'M8.7 3.7A6 6 0 0 1 18 8c0 3.3.7 5.3 1.4 6.5M17 17H3s3-1 3-8c0-.6.1-1.2.3-1.8M10 20a2 2 0 0 0 4 0M3 3l18 18',
  share: 'M12 15V3M7 8l5-5 5 5M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6',
  copy: 'M9 9h10v11H9zM5 15V5a1 1 0 0 1 1-1h9',
} as const

function ActionIcon({ name, size = 20 }: { name: keyof typeof ICONS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

interface MenuItem {
  action: MenuAction
  label: string
  icon: keyof typeof ICONS
  danger?: boolean
}

interface OpenMenu {
  row: HTMLElement
  rect: DOMRect
  items: MenuItem[]
}

interface RowGestures {
  run(action: SwipeAction, row: HTMLElement): void
}

const RowGesturesContext = createContext<RowGestures>({ run: () => {} })

function pressed(element: Element | null): boolean {
  return element?.getAttribute('aria-pressed') === 'true'
}

function clickInRow(row: HTMLElement, selector: string): void {
  row.querySelector<HTMLButtonElement>(selector)?.click()
}

function menuItems(row: HTMLElement): MenuItem[] {
  const items: MenuItem[] = [
    { action: 'open', label: 'Відкрити набір', icon: 'open' },
    { action: 'offers', label: 'Де купити', icon: 'offers' },
  ]
  const heart = row.querySelector(HEART)
  if (heart) items.push({ action: 'fav', label: pressed(heart) ? 'Прибрати з обраного' : 'В обране', icon: 'fav' })
  const bell = row.querySelector(BELL)
  if (bell && pressed(bell)) items.push({ action: 'bell', label: 'Не стежити', icon: 'unwatch', danger: true })
  else items.push({ action: bell ? 'bell' : 'watch', label: 'Стежити за ціною', icon: 'watch' })
  items.push({ action: 'share', label: 'Поділитися', icon: 'share' })
  if (row.dataset.setNumber) items.push({ action: 'copy', label: 'Скопіювати номер', icon: 'copy' })
  return items
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const field = document.createElement('textarea')
    field.value = text
    field.setAttribute('readonly', '')
    field.style.position = 'fixed'
    field.style.opacity = '0'
    document.body.append(field)
    field.select()
    const copied = document.execCommand('copy')
    field.remove()
    return copied
  }
}

interface Swipe {
  row: HTMLElement
  body: HTMLElement | null
  width: number
  x: number
  y: number
  base: number
  dx: number
  horizontal: boolean | null
  timer: number
}

export function RowGesturesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { account, openLogin } = useAuth()
  const [toast, showToast] = useToast()
  const [menu, setMenu] = useState<OpenMenu | null>(null)
  const openRow = useRef<HTMLElement | null>(null)
  const watching = useRef(new Set<string>())

  const closeSwipe = useCallback(() => {
    const row = openRow.current
    if (!row) return
    const body = row.querySelector<HTMLElement>('.c-urow__body')
    if (body) body.style.transform = ''
    row.classList.remove('is-open')
    openRow.current = null
  }, [])

  /** Стеження зі списку завжди вмикається: стан стеження рядки каталогу не знають. */
  const watch = useCallback(
    async (setId: string) => {
      if (!account) {
        writePendingWatch(setId)
        openLogin()
        return
      }
      if (watching.current.has(setId)) return
      watching.current.add(setId)
      try {
        const response = await fetch(`/api/me/price-alerts/${encodeURIComponent(setId)}`, { method: 'PUT' })
        if (response.status === 204) {
          track('price_watch_started', { set_id: setId, source: 'row' })
          showToast('Готово, стежимо за ціною')
        } else if (response.status === 401) {
          writePendingWatch(setId)
          openLogin()
        } else showToast(response.status === 409 ? WATCH_LIMIT_TEXT : 'Не вдалося увімкнути стеження. Спробуйте ще раз')
      } catch {
        showToast('Не вдалося увімкнути стеження. Спробуйте ще раз')
      } finally {
        watching.current.delete(setId)
      }
    },
    [account, openLogin, showToast],
  )

  useEffect(() => {
    if (!account) return
    const timer = window.setTimeout(() => {
      const pending = takePendingWatch()
      if (pending) void watch(pending)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [account, watch])

  /** «Поділитися»: у Telegram — вибір чату, у браузері — системне меню або копія посилання. */
  const share = useCallback(
    async (row: HTMLElement) => {
      const url = new URL(row.dataset.setPath ?? '/', window.location.origin)
      url.searchParams.set('src', 'share')
      const name = row.dataset.setName ?? ''
      const text = row.dataset.setNumber ? `${row.dataset.setNumber} ${name}` : name
      const telegram = telegramWebApp()
      if (telegram) {
        telegram.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url.toString())}&text=${encodeURIComponent(text)}`)
        return
      }
      if (navigator.share) {
        try {
          await navigator.share({ title: text, url: url.toString() })
        } catch {}
        return
      }
      showToast((await copyText(url.toString())) ? 'Посилання скопійовано' : 'Не вдалося скопіювати')
    },
    [showToast],
  )

  const offers = useCallback((row: HTMLElement) => router.push(`${row.dataset.setPath}?sheet=shops`), [router])

  const run = useCallback(
    (action: SwipeAction | MenuAction, row: HTMLElement) => {
      closeSwipe()
      const setId = row.dataset.setId ?? ''
      switch (action) {
        case 'open':
          router.push(row.dataset.setPath ?? '/')
          break
        case 'offers':
          offers(row)
          break
        case 'fav':
          clickInRow(row, HEART)
          break
        case 'watch':
          void watch(setId)
          break
        case 'bell':
        case 'unwatch':
        case 'rewatch':
          clickInRow(row, BELL)
          break
        case 'share':
          void share(row)
          break
        case 'copy':
          void copyText(row.dataset.setNumber ?? '').then((copied) => showToast(copied ? 'Номер скопійовано' : 'Не вдалося скопіювати'))
          break
      }
    },
    [closeSwipe, offers, router, share, showToast, watch],
  )

  useEffect(() => {
    const mobile = window.matchMedia(MOBILE_LAYOUT)
    let swipe: Swipe | null = null
    let suppressClick = false

    const onDown = (event: PointerEvent) => {
      suppressClick = false
      const target = event.target as Element
      const row = target.closest<HTMLElement>(ROW)
      if (openRow.current && !target.closest('.c-urow.is-open')) closeSwipe()
      if (!row || !mobile.matches || event.button !== 0 || target.closest('.c-urow__actions, .c-uact')) return
      const width = row.classList.contains('is-open') ? (row.querySelector('.c-urow__actions')?.childElementCount ?? 0) * SWIPE_ACTION_PX : 0
      swipe = {
        row,
        body: row.querySelector<HTMLElement>('.c-urow__body'),
        width,
        x: event.clientX,
        y: event.clientY,
        base: -width,
        dx: 0,
        horizontal: null,
        timer: window.setTimeout(() => {
          if (!swipe || swipe.horizontal !== null) return
          const target = swipe.row
          swipe = null
          suppressClick = true
          closeSwipe()
          window.getSelection()?.removeAllRanges()
          telegramWebApp()?.HapticFeedback?.impactOccurred('medium')
          setMenu({ row: target, rect: target.getBoundingClientRect(), items: menuItems(target) })
        }, LONG_PRESS_MS),
      }
    }

    const onMove = (event: PointerEvent) => {
      if (!swipe) return
      const dx = event.clientX - swipe.x
      const dy = event.clientY - swipe.y
      if (swipe.horizontal === null && Math.hypot(dx, dy) > SWIPE_START_PX) {
        window.clearTimeout(swipe.timer)
        swipe.horizontal = Math.abs(dx) > Math.abs(dy) && Boolean(swipe.body) && Boolean(swipe.row.dataset.swipe) && (dx < 0 || swipe.width > 0)
        if (!swipe.horizontal) {
          swipe = null
          return
        }
        if (!swipe.width) swipe.width = (swipe.row.querySelector('.c-urow__actions')?.childElementCount ?? 0) * SWIPE_ACTION_PX
        swipe.row.classList.add('is-dragging')
      }
      if (swipe.horizontal && swipe.body) {
        swipe.dx = dx
        const offset = Math.min(0, Math.max(-swipe.width * 1.2, swipe.base + dx))
        swipe.body.style.transform = `translateX(${offset}px)`
      }
    }

    const onUp = () => {
      if (!swipe) return
      window.clearTimeout(swipe.timer)
      const { row, body, horizontal, base, dx, width } = swipe
      swipe = null
      if (!horizontal || !body) return
      suppressClick = true
      row.classList.remove('is-dragging')
      if (base + dx < -width / 2) {
        if (openRow.current !== row) closeSwipe()
        body.style.transform = `translateX(${-width}px)`
        row.classList.add('is-open')
        openRow.current = row
      } else {
        body.style.transform = ''
        row.classList.remove('is-open')
        if (openRow.current === row) openRow.current = null
      }
    }

    /** Клік після свайпу чи довгого натиску не відкриває набір і не закриває щойно відкрите меню. */
    const onClick = (event: MouseEvent) => {
      if (!suppressClick) return
      suppressClick = false
      event.preventDefault()
      event.stopPropagation()
    }

    /** Довгий натиск у iOS інакше виділяє текст і показує системне меню поверх нашого. */
    const onNative = (event: Event) => {
      if (mobile.matches && event.target instanceof Element && event.target.closest(ROW)) event.preventDefault()
    }

    document.addEventListener('pointerdown', onDown)
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
    document.addEventListener('click', onClick, true)
    document.addEventListener('contextmenu', onNative)
    document.addEventListener('selectstart', onNative)
    return () => {
      if (swipe) window.clearTimeout(swipe.timer)
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('contextmenu', onNative)
      document.removeEventListener('selectstart', onNative)
    }
  }, [closeSwipe])

  const value = useMemo<RowGestures>(() => ({ run }), [run])
  return (
    <RowGesturesContext.Provider value={value}>
      {children}
      {menu ? <RowMenu menu={menu} onClose={() => setMenu(null)} onPick={(action) => run(action, menu.row)} /> : null}
      <div className="c-desk c-toast-host">{toast}</div>
    </RowGesturesContext.Provider>
  )
}

/** Меню довгого натиску: копія рядка піднімається над затемненням, дії — під нею або над нею. */
function RowMenu({ menu, onClose, onPick }: { menu: OpenMenu; onClose(): void; onPick(action: MenuAction): void }) {
  const liftedRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const lifted = liftedRef.current
    const list = menuRef.current
    if (!lifted || !list) return
    const copy = menu.row.cloneNode(true) as HTMLElement
    copy.removeAttribute('data-set-row')
    copy.classList.remove('is-open', 'is-dragging')
    lifted.replaceChildren(copy)
    const below = menu.rect.bottom + 8
    const height = list.offsetHeight
    list.style.top = `${below + height < window.innerHeight - 16 ? below : Math.max(16, menu.rect.top - height - 8)}px`
  }, [menu])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onClose, { passive: true })
    window.addEventListener('resize', onClose)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onClose)
      window.removeEventListener('resize', onClose)
    }
  }, [onClose])

  return createPortal(
    <div
      className="c-ctx"
      onClick={(event) => {
        const item = (event.target as Element).closest<HTMLElement>('[data-menu-action]')
        onClose()
        if (item) onPick(item.dataset.menuAction as MenuAction)
      }}
    >
      <div ref={liftedRef} className="c-ctx__row" style={{ top: menu.rect.top, left: menu.rect.left, width: menu.rect.width }} />
      <div ref={menuRef} className="c-ctx__menu" role="menu">
        {menu.items.map((item) => (
          <button
            key={item.action}
            type="button"
            className={`c-ctx__item${item.danger ? ' c-ctx__item--danger' : ''}`}
            role="menuitem"
            data-menu-action={item.action}
          >
            <span>{item.label}</span>
            <ActionIcon name={item.icon} />
          </button>
        ))}
      </div>
    </div>,
    document.body,
  )
}

const SWIPE_LABELS: Record<Exclude<SwipeAction, 'fav'>, { label: string; icon: keyof typeof ICONS; tone: string }> = {
  watch: { label: 'Стежити', icon: 'watch', tone: 'watch' },
  rewatch: { label: 'Стежити', icon: 'watch', tone: 'watch' },
  unwatch: { label: 'Не стежити', icon: 'unwatch', tone: 'unwatch' },
  offers: { label: 'Де купити', icon: 'offers', tone: 'offers' },
}

/** Кнопки під рядком, які відкриває свайп ліворуч; «В обране» показує поточний стан сердечка. */
export function SwipeActions({ setId, actions, selected }: { setId: string; actions: SwipeAction[]; selected?: boolean }) {
  const { run } = useContext(RowGesturesContext)
  const favourite = useFavourite(setId, selected)
  return (
    <div className="c-urow__actions" aria-hidden="true">
      {actions.map((action) => {
        const view =
          action === 'fav'
            ? favourite.selected
              ? { label: 'Прибрати', icon: 'fav' as const, tone: 'unfav' }
              : { label: 'В обране', icon: 'fav' as const, tone: 'fav' }
            : SWIPE_LABELS[action]
        return (
          <button
            key={action}
            type="button"
            tabIndex={-1}
            className={`c-urow__action c-urow__action--${view.tone}`}
            onClick={(event) => {
              event.stopPropagation()
              const row = event.currentTarget.closest<HTMLElement>(ROW)
              if (row) run(action, row)
            }}
          >
            <ActionIcon name={view.icon} size={22} />
            {view.label}
          </button>
        )
      })}
    </div>
  )
}
