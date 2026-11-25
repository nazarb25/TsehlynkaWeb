import Link from 'next/link'

import { ChevronRight, FileIcon } from '@/components/icons'
import { SectionHead } from '@/components/ui/SectionHead'
import type { SetDetails } from '@/lib/api/types'
import {
  INSTRUCTION_LABELS,
  LANGUAGE_LABELS,
  LIFECYCLE_LABELS,
  linkedInstructions,
  originalName,
  otherNumbers,
  PACKAGING_LABELS,
  packagingType,
} from '@/lib/catalog/set'
import { ageMark, release, thousands } from '@/lib/format'
import { themePath } from '@/lib/routes'

type Edition = SetDetails['editions'][number]

interface SetAboutProps {
  details: SetDetails
  figureCount: number | null
  edition: Edition | undefined
  now: Date
}

/** «Про набір»: опис і характеристики, поруч — інструкції. */
export function SetAbout({ details, figureCount, edition, now }: SetAboutProps) {
  const age = ageMark(details.age_label, details.age_min_months)
  const instructions = linkedInstructions(details)
  const packaging = packagingType(details)
  const numbers = otherNumbers(details)
  const original = originalName(details)

  const facts: [string, React.ReactNode][] = [
    ...(details.theme_path.length
      ? [
          [
            'Тема',
            <span key="theme" className="facts__path">
              {details.theme_path.map((item, index) => (
                <span key={item.id}>
                  {index ? ' › ' : ''}
                  <Link className="link" href={themePath(item)}>
                    {item.name}
                  </Link>
                </span>
              ))}
            </span>,
          ] as [string, React.ReactNode],
        ]
      : []),
    ...(details.intro_year ? [['Рік випуску', String(details.intro_year)] as [string, React.ReactNode]] : []),
    ...(edition?.release_date ? [['Вихід', release(edition.release_date, edition.release_date_precision, now).replace(/^Вий\S+ /, '')] as [string, React.ReactNode]] : []),
    ...(age ? [['Вік на коробці', age] as [string, React.ReactNode]] : []),
    ...(details.declared_piece_count ? [['Деталей', thousands(details.declared_piece_count)] as [string, React.ReactNode]] : []),
    ...(figureCount ? [['Фігурок', String(figureCount)] as [string, React.ReactNode]] : []),
    ['Тип продукту', details.set_type.name],
    ...(LIFECYCLE_LABELS[details.lifecycle_status] ? [['Випуск', LIFECYCLE_LABELS[details.lifecycle_status]] as [string, React.ReactNode]] : []),
    ...(packaging && PACKAGING_LABELS[packaging] ? [['Паковання', PACKAGING_LABELS[packaging]] as [string, React.ReactNode]] : []),
    ...(numbers.length ? [['Інші номери', numbers.join(', ')] as [string, React.ReactNode]] : []),
    ...(original ? [['Оригінальна назва', original] as [string, React.ReactNode]] : []),
  ]

  return (
    <div className={`set__info${instructions.length ? '' : ' set__info--single'}`}>
      <section aria-labelledby="about-title">
        <SectionHead id="about-title" title="Про набір" />
        {details.description ? <p className="set__desc">{details.description}</p> : null}
        <dl className="facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className="num">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      {instructions.length ? (
        <section aria-labelledby="instructions-title">
          <SectionHead id="instructions-title" title="Інструкції" />
          <ul className="instr">
            {instructions.map((item, index) => (
              <li key={`${item.url}-${index}`}>
                <a href={item.url ?? undefined} target="_blank" rel="noopener nofollow">
                  <FileIcon size={18} />
                  <span>
                    <b>
                      {item.total_parts && item.part_number ? `Частина ${item.part_number} із ${item.total_parts}` : item.title}
                    </b>
                    <small>
                      {[INSTRUCTION_LABELS[item.instruction_type], item.language_code ? (LANGUAGE_LABELS[item.language_code] ?? item.language_code) : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </small>
                  </span>
                  <ChevronRight size={16} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
