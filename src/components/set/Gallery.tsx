'use client'

import { useEffect, useRef, useState } from 'react'

import { BrickIcon, ChevronLeft, ChevronRight } from '@/components/icons'

export interface GalleryImage {
  src: string
  thumb: string
  alt: string
  packaging: boolean
}

/** Фото набору: велике фото 3:2 і мініатюри; на телефоні — гортання пальцем. */
export function Gallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [index, setIndex] = useState(0)
  const track = useRef<HTMLDivElement>(null)
  const firstPackaging = images.findIndex((image) => image.packaging)
  const hasBoth = firstPackaging > 0

  useEffect(() => {
    const element = track.current
    if (!element) return
    const onScroll = () => {
      const next = Math.round(element.scrollLeft / element.clientWidth)
      setIndex((value) => (value === next ? value : next))
    }
    element.addEventListener('scroll', onScroll, { passive: true })
    return () => element.removeEventListener('scroll', onScroll)
  }, [])

  const show = (next: number) => {
    const bounded = Math.max(0, Math.min(images.length - 1, next))
    setIndex(bounded)
    const element = track.current
    if (element) element.scrollTo({ left: bounded * element.clientWidth, behavior: 'smooth' })
  }

  if (!images.length) {
    return (
      <div className="gallery">
        <div className="gallery__main stage stage--white gallery__empty">
          <BrickIcon size={96} strokeWidth={1.2} />
          <span>Фото ще немає</span>
        </div>
      </div>
    )
  }

  const current = images[index]
  return (
    <div className="gallery">
      <div className="gallery__main">
        <div className="gallery__track" ref={track}>
          {images.map((image, position) => (
            <div key={image.src} className="gallery__slide stage stage--white">
              <img
                src={image.src}
                alt={image.alt || `${name}, фото ${position + 1}`}
                loading={position === 0 ? 'eager' : 'lazy'}
                fetchPriority={position === 0 ? 'high' : undefined}
                decoding="async"
                draggable={false}
              />
            </div>
          ))}
        </div>
        {images.length > 1 ? (
          <>
            <button type="button" className="gallery__nav gallery__nav--prev hide-mobile" aria-label="Попереднє фото" onClick={() => show(index - 1)} disabled={index === 0}>
              <ChevronLeft size={20} />
            </button>
            <button type="button" className="gallery__nav gallery__nav--next hide-mobile" aria-label="Наступне фото" onClick={() => show(index + 1)} disabled={index === images.length - 1}>
              <ChevronRight size={20} />
            </button>
            <span className="gallery__counter num">
              {index + 1} / {images.length}
            </span>
          </>
        ) : null}
        {hasBoth ? (
          <div className="gallery__kinds" role="group" aria-label="Що показати">
            <button type="button" aria-pressed={!current?.packaging} onClick={() => show(0)}>
              Модель
            </button>
            <button type="button" aria-pressed={Boolean(current?.packaging)} onClick={() => show(firstPackaging)}>
              Паковання
            </button>
          </div>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="gallery__thumbs hide-mobile">
          {images.slice(0, 6).map((image, position) => (
            <button
              key={image.src}
              type="button"
              className="stage stage--white"
              aria-label={`Фото ${position + 1}`}
              aria-current={position === index ? 'true' : undefined}
              onClick={() => show(position)}
            >
              <img src={image.thumb} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
