/** Іконки мобільного вигляду — ті самі, що в Mini App. */

export function Chevron() {
  return (
    <svg
      className="c-chevron"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

export function Caret() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function XIcon({ size = 12, width = 2.6 }: { size?: number; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function SearchGlyph({ size = 18, width = 2.2 }: { size?: number; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.5-4.5" />
    </svg>
  )
}

export function FilterGlyph({ size = 16, width = 2.2 }: { size?: number; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M7 12h10M10 17h4" />
    </svg>
  )
}

export function SortGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" />
    </svg>
  )
}

export function ListGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  )
}

export function GridGlyph({ size = 18, width = 2 }: { size?: number; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function ModeIcon({ mode }: { mode: 'all' | 'sale' }) {
  return mode === 'all' ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h12v18l-6-4-6 4z" />
    </svg>
  ) : (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 8h14l-1 12H6z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

export function MetaIcon({ kind }: { kind: 'number' | 'year' | 'pieces' | 'age' }) {
  if (kind === 'number')
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d="M5 9h15M4 15h15M10 3 8 21M16 3l-2 18" />
      </svg>
    )
  if (kind === 'year')
    return (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M4 11h16" />
      </svg>
    )
  if (kind === 'age')
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="7.5" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </svg>
    )
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="10" width="18" height="10" rx="2" />
      <rect x="6" y="6" width="4" height="4" rx="1" />
      <rect x="14" y="6" width="4" height="4" rx="1" />
    </svg>
  )
}

export function StateIcon({ kind }: { kind: 'search' | 'filter' | 'offline' | 'error' }) {
  if (kind === 'search') return <SearchGlyph size={22} width={2} />
  if (kind === 'filter') return <FilterGlyph size={24} width={2} />
  if (kind === 'offline')
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M2 8.8a15 15 0 0 1 4.2-2.6M9.8 5.2A15 15 0 0 1 22 8.8M5 12.6a10 10 0 0 1 4-2.4M15.5 10.6A10 10 0 0 1 19 12.6M8.5 16.4a5 5 0 0 1 7 0M12 20h.01M3 3l18 18" />
      </svg>
    )
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4 2.5 20h19z" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  )
}

export function NoPhoto() {
  return (
    <span className="c-no-photo">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="10" width="18" height="9" rx="1.5" />
        <rect x="6" y="6.5" width="4" height="3.5" rx="1" />
        <rect x="14" y="6.5" width="4" height="3.5" rx="1" />
      </svg>
      <span className="c-visually-hidden">Немає фото</span>
    </span>
  )
}

export function MiniPhoto({ src, alt, className, eager }: { src: string | null | undefined; alt: string; className: string; eager?: boolean }) {
  return (
    <span className={`c-photo-stage ${className}`}>
      {src ? <img className="c-photo-stage__photo" draggable={false} src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" /> : <NoPhoto />}
    </span>
  )
}

export function TrademarkNotice() {
  return (
    <p className="c-menu-footnote c-trademark">
      LEGO® — торгова марка групи компаній LEGO. Цеглинка — незалежний неофіційний проєкт, не пов&apos;язаний із групою компаній LEGO і не спонсорований нею.
      Зображення наборів і фігурок та інструкції захищені авторським правом групи компаній LEGO.
    </p>
  )
}
