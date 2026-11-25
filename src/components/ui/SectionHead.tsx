import Link from 'next/link'

import { ChevronRight } from '@/components/icons'

interface SectionHeadProps {
  title: string
  href?: string
  count?: number
  id?: string
}

/** Заголовок розділу; з адресою — клікабельний цілком, зі стрілкою. */
export function SectionHead({ title, href, count, id }: SectionHeadProps) {
  const content = (
    <>
      <h2 id={id}>{title}</h2>
      {count !== undefined ? <span className="count num">{count}</span> : null}
      {href ? <ChevronRight size={22} /> : null}
    </>
  )
  return href ? (
    <Link className="section-head" href={href}>
      {content}
    </Link>
  ) : (
    <div className="section-head">{content}</div>
  )
}
