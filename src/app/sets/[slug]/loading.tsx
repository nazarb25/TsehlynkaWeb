/** Скелет сторінки набору: галерея й панель ціни. */
export default function Loading() {
  return (
    <div className="wrap skeleton" role="status" aria-label="Завантаження">
      <span className="skeleton__line" />
      <div className="skeleton__set">
        <span className="skeleton__card skeleton__card--photo" />
        <span className="skeleton__card skeleton__card--buy" />
      </div>
    </div>
  )
}
