'use client'

import { useEffect, useRef, useState } from 'react'

import { BrickIcon, ChevronLeft, ChevronRight, CloseIcon } from '@/components/icons'

export interface GalleryImage {
  src: string
  thumb: string
  alt: string
  packaging: boolean
}

/** Фото набору: велике фото 3:2 і мініатюри; на телефоні — гортання пальцем. */
export function Gallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [index, setIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)
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
    <>
    <div className="gallery">
      <div className="gallery__main">
        <div className="gallery__track" ref={track}>
          {images.map((image, position) => (
            <button
              key={image.src}
              type="button"
              className="gallery__slide stage stage--white"
              aria-label={`Відкрити фото ${position + 1} на весь екран`}
              onClick={() => setZoomed(true)}
            >
              <img
                src={image.src}
                alt={image.alt || `${name}, фото ${position + 1}`}
                loading={position === 0 ? 'eager' : 'lazy'}
                fetchPriority={position === 0 ? 'high' : undefined}
                decoding="async"
                draggable={false}
              />
            </button>
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
    {zoomed ? <Lightbox images={images} name={name} index={index} onShow={show} onClose={() => setZoomed(false)} /> : null}
    </>
  )
}

interface LightboxProps {
  images: GalleryImage[]
  name: string
  index: number
  onShow: (index: number) => void
  onClose: () => void
}

/** Фото на весь екран: стрілки, клавіші ← → і Esc, гортання пальцем. */
function Lightbox({ images, name, index, onShow, onClose }: LightboxProps) {
  const touchX = useRef<number | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const image = images[index]

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowLeft') onShow(index - 1)
      else if (event.key === 'ArrowRight') onShow(index + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index, onShow, onClose])

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [])

  if (!image) return null
  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${name}: фото ${index + 1} з ${images.length}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      onTouchStart={(event) => {
        touchX.current = event.touches[0]?.clientX ?? null
      }}
      onTouchEnd={(event) => {
        const start = touchX.current
        const end = event.changedTouches[0]?.clientX
        touchX.current = null
        if (start === null || end === undefined || Math.abs(end - start) < 40) return
        onShow(end < start ? index + 1 : index - 1)
      }}
    >
      <img src={image.src} alt={image.alt || `${name}, фото ${index + 1}`} className="lightbox__image" draggable={false} />
      <button ref={closeRef} type="button" className="lightbox__close" aria-label="Закрити" onClick={onClose}>
        <CloseIcon size={22} />
      </button>
      {images.length > 1 ? (
        <>
          <button type="button" className="lightbox__nav lightbox__nav--prev" aria-label="Попереднє фото" onClick={() => onShow(index - 1)} disabled={index === 0}>
            <ChevronLeft size={24} />
          </button>
          <button type="button" className="lightbox__nav lightbox__nav--next" aria-label="Наступне фото" onClick={() => onShow(index + 1)} disabled={index === images.length - 1}>
            <ChevronRight size={24} />
          </button>
          <span className="lightbox__counter num">
            {index + 1} / {images.length}
          </span>
        </>
      ) : null}
    </div>
  )
}
