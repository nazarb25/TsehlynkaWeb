import { SetTiles } from '@/components/catalog/SetTiles'
import { SectionHead } from '@/components/ui/SectionHead'
import { findRetailSets } from '@/lib/api/catalog'
import type { SetDetails } from '@/lib/api/types'
import { themePath } from '@/lib/routes'
import { safe } from '@/lib/safe'

type Theme = SetDetails['theme_path'][number]

/** «Інші набори цієї теми»: стрімиться окремо, щоб не затримувати верх сторінки. */
export async function RelatedSets({ setId, theme }: { setId: string; theme: Theme }) {
  const related = await safe(findRetailSets({ theme_id: theme.id, sort: 'year_desc', limit: 6 }))
  const others = (related?.items ?? []).filter((item) => item.id !== setId).slice(0, 5)
  if (!others.length) return null
  return (
    <section aria-labelledby="others-title">
      <SectionHead id="others-title" title="Інші набори цієї теми" href={themePath(theme)} />
      <SetTiles sets={others} context="sale" columns={5} />
    </section>
  )
}

export function RelatedSetsSkeleton() {
  return (
    <section className="skeleton skeleton--inline" aria-hidden="true">
      <span className="skeleton__line" />
      <div className="skeleton__grid skeleton__grid--5">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className="skeleton__card" />
        ))}
      </div>
    </section>
  )
}
