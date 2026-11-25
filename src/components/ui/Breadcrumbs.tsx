import Link from 'next/link'

import { ChevronRight } from '@/components/icons'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, type Crumb } from '@/lib/seo'

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const crumbs: Crumb[] = [{ name: 'Головна', path: '/' }, ...items]
  return (
    <>
      <nav aria-label="Навігація">
        <ol className="crumbs">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1
            return (
              <li key={`${crumb.name}-${index}`}>
                {index > 0 ? <ChevronRight size={14} /> : null}
                {last || !crumb.path ? (
                  <span aria-current={last ? 'page' : undefined}>{crumb.name}</span>
                ) : (
                  <Link href={crumb.path}>{crumb.name}</Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbSchema(crumbs)} />
    </>
  )
}
