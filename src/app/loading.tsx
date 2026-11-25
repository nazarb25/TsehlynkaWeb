/** Скелет під час переходу між сторінками; з'являється із затримкою, щоб не блимати на швидких переходах. */
export default function Loading() {
  return (
    <div className="wrap skeleton" role="status" aria-label="Завантаження">
      <span className="skeleton__line skeleton__line--title" />
      <span className="skeleton__line" />
      <div className="skeleton__grid">
        {Array.from({ length: 8 }, (_, index) => (
          <span key={index} className="skeleton__card" />
        ))}
      </div>
    </div>
  )
}
