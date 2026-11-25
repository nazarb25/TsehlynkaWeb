import { AgeIcon, CalendarIcon, HashIcon, PiecesIcon } from '@/components/icons'
import { plural, thousands } from '@/lib/format'

interface SetMetaProps {
  number?: string | null
  year?: number | null
  pieces?: number | null
  age?: string | null
  className?: string
}

/** Параметри набору: номер, рік, деталі й вік, лише відомі значення. */
export function SetMeta({ number, year, pieces, age, className }: SetMetaProps) {
  return (
    <span className={`meta num${className ? ` ${className}` : ''}`}>
      {number ? (
        <span>
          <HashIcon />
          <span className="visually-hidden">Номер </span>
          {number}
        </span>
      ) : null}
      {year ? (
        <span>
          <CalendarIcon />
          <span className="visually-hidden">Рік </span>
          {year}
        </span>
      ) : null}
      {pieces ? (
        <span>
          <PiecesIcon />
          {thousands(pieces)}
          <span className="visually-hidden"> {plural(pieces, 'деталь', 'деталі', 'деталей')}</span>
        </span>
      ) : null}
      {age ? (
        <span className="meta__age">
          <AgeIcon />
          <span className="visually-hidden">Вік </span>
          {age}
        </span>
      ) : null}
    </span>
  )
}
