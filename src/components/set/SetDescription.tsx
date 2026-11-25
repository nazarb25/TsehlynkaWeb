'use client'

import { useLayoutEffect, useRef, useState } from 'react'

import { ChevronDown } from '@/components/icons'

/** Абзаци опису: порожній рядок ділить абзаци, `•` починає пункт. */
export function descriptionParagraphs(text: string): string[][] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) =>
      paragraph
        .split(/\n|\s+(?=•\s)/)
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .filter((lines) => lines.length)
}

/** Опис набору: два рядки й кнопка, що розгортає решту. */
export function SetDescription({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const [clamped, setClamped] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || open) return
    const measure = () => setClamped(element.scrollHeight > element.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [open])

  return (
    <div className="desc">
      <div ref={ref} className={`desc__text${open ? '' : ' desc__text--clamped'}`}>
        {descriptionParagraphs(text).map((lines, index) => (
          <p key={index}>
            {lines.map((line, position) => (
              <span key={position} className={line.startsWith('•') ? 'desc__item' : undefined}>
                {line.replace(/^•\s*/, '')}
              </span>
            ))}
          </p>
        ))}
      </div>
      {clamped || open ? (
        <button type="button" className="desc__toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? 'Згорнути' : 'Читати повністю'}
          <ChevronDown size={16} className={open ? 'is-flipped' : undefined} />
        </button>
      ) : null}
    </div>
  )
}
