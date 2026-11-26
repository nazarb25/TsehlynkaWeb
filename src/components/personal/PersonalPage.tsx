/** Особистий екран: на телефоні — як у Mini App, на десктопі — той самий вигляд у колонці по центру. */
export function PersonalPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="c-desk-page">
      <div className="c-desk">{children}</div>
    </div>
  )
}
