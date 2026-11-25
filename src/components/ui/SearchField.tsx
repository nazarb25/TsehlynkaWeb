import { SearchIcon } from '@/components/icons'

interface SearchFieldProps {
  defaultValue?: string | null
  button?: boolean
  className?: string
  autoFocus?: boolean
}

/** Пошук звичайною формою: працює без JavaScript і веде на сторінку результатів. */
export function SearchField({ defaultValue, button, className, autoFocus }: SearchFieldProps) {
  return (
    <form role="search" action="/search" className={`search-field${className ? ` ${className}` : ''}`}>
      <SearchIcon size={20} />
      <label className="visually-hidden" htmlFor="page-search">
        Пошук наборів
      </label>
      <input
        id="page-search"
        type="search"
        name="q"
        defaultValue={defaultValue ?? ''}
        placeholder="Номер, назва, тема, персонаж"
        autoComplete="off"
        enterKeyHint="search"
        autoFocus={autoFocus}
      />
      {button ? (
        <button type="submit" className="button button--primary">
          Знайти
        </button>
      ) : null}
    </form>
  )
}
