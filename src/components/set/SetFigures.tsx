import { Photo } from '@/components/ui/Photo'
import { SectionHead } from '@/components/ui/SectionHead'
import type { FigureSet } from '@/lib/catalog/set'

/** Фігурки набору й випадкові фігурки, якщо вони є. */
export function SetFigures({ figures }: { figures: FigureSet }) {
  if (!figures.figures.length && !figures.randomFigures.length) return null
  return (
    <section aria-labelledby="figures-title">
      <SectionHead id="figures-title" title="Фігурки в наборі" count={figures.figureCount || undefined} />
      {figures.figures.length ? (
        <ul className="figs">
          {figures.figures.map((figure) => (
            <li key={figure.figure_id} className="fig">
              <Photo src={figure.image_url} className="fig__photo stage--white" iconSize={22}>
                {figure.quantity > 1 ? <span className="fig__qty num">×{figure.quantity}</span> : null}
              </Photo>
              <span>{figure.character_name ?? figure.name}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {figures.randomFigures.length ? (
        <>
          <h3 className="figs__title">
            {figures.randomPick
              ? `Випадкові: ${figures.randomPick} з ${figures.randomFigures.length}`
              : `Випадкові фігурки: ${figures.randomFigures.length}`}
          </h3>
          <ul className="figs">
            {figures.randomFigures.map((figure) => (
              <li key={figure.figure_id} className="fig">
                <Photo src={figure.image_url} className="fig__photo stage--white" iconSize={22} />
                <span>{figure.character_name ?? figure.name}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  )
}
