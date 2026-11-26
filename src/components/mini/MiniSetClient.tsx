'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { MiniSheet } from './MiniSheet'

function galleryIndex(track: HTMLElement): number {
  return Math.round(track.scrollLeft / Math.max(track.clientWidth, 1))
}

function scrollGallery(track: HTMLElement, index: number, smooth: boolean) {
  track.scrollTo({ left: index * track.clientWidth, behavior: smooth ? 'smooth' : 'instant' })
}

function syncGalleryTrack(track: HTMLElement) {
  const owner = track.closest<HTMLElement>('[data-gallery], [data-gallery-viewer]')
  if (!owner) return
  const index = galleryIndex(track)
  const counter = owner.querySelector('[data-gallery-index]')
  if (counter) counter.textContent = String(index + 1)
  const last = track.children.length - 1
  owner.querySelectorAll<HTMLButtonElement>('[data-gallery-step]').forEach((step) => {
    step.disabled = Number(step.dataset.galleryStep) < 0 ? index <= 0 : index >= last
  })
  owner.querySelectorAll('.c-gallery__dots i').forEach((dot, position) => dot.classList.toggle('is-active', position === index))
  const jumps = owner.querySelectorAll<HTMLElement>('[data-gallery-jump]')
  const box = jumps[1]
  if (jumps.length === 2 && box) {
    const isBox = index >= Number(box.dataset.galleryJump)
    jumps.forEach((jump, position) => {
      const active = (position === 1) === isBox
      jump.classList.toggle('is-active', active)
      jump.setAttribute('aria-pressed', active ? 'true' : 'false')
    })
  }
}

function stepGallery(track: HTMLElement, offset: number) {
  const target = Math.min(Math.max(galleryIndex(track) + offset, 0), track.children.length - 1)
  scrollGallery(track, target, true)
}

/** Поведінка картки набору Mini App: стрічка фото, перегляд на весь екран, фігурки й перехід до них. */
export function MiniSetBehaviour({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const tracks = [...root.querySelectorAll<HTMLElement>('[data-gallery-track]')]
    const cleanups: (() => void)[] = []
    for (const track of tracks) {
      const onScroll = () => syncGalleryTrack(track)
      track.addEventListener('scroll', onScroll, { passive: true })
      cleanups.push(() => track.removeEventListener('scroll', onScroll))
      syncGalleryTrack(track)
    }

    const viewer = root.querySelector<HTMLElement>('[data-gallery-viewer]')
    const inline = root.querySelector<HTMLElement>('[data-gallery] [data-gallery-track]')

    const openGallery = (index: number) => {
      if (!viewer) return
      viewer.hidden = false
      document.body.classList.add('is-gallery-open')
      const track = viewer.querySelector<HTMLElement>('[data-gallery-track]')
      if (track) {
        scrollGallery(track, index, false)
        syncGalleryTrack(track)
      }
    }
    const closeGallery = () => {
      if (!viewer || viewer.hidden) return
      const track = viewer.querySelector<HTMLElement>('[data-gallery-track]')
      const index = track ? Math.round(track.scrollLeft / Math.max(window.innerWidth, 1)) : 0
      viewer.hidden = true
      document.body.classList.remove('is-gallery-open')
      if (inline) scrollGallery(inline, index, false)
    }

    const onClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        '[data-gallery-open], [data-gallery-jump], [data-gallery-step], [data-gallery-close], [data-figures-toggle], [data-scroll-to]',
      )
      if (!target) return
      if (target.matches('[data-gallery-open]')) openGallery(Number(target.dataset.galleryOpen))
      else if (target.matches('[data-gallery-jump], [data-gallery-step]')) {
        const owner = target.closest('[data-gallery], [data-gallery-viewer]')
        const track = owner?.querySelector<HTMLElement>('[data-gallery-track]')
        if (!track) return
        if (target.matches('[data-gallery-jump]')) scrollGallery(track, Number(target.dataset.galleryJump), true)
        else stepGallery(track, Number(target.dataset.galleryStep))
      } else if (target.matches('[data-gallery-close]')) closeGallery()
      else if (target.matches('[data-figures-toggle]')) {
        const grid = target.previousElementSibling
        if (!grid) return
        const open = grid.classList.toggle('is-collapsed') === false
        target.setAttribute('aria-expanded', open ? 'true' : 'false')
        target.textContent = open ? 'Згорнути' : 'Показати всі'
      } else if (target.matches('[data-scroll-to]')) {
        event.preventDefault()
        document.getElementById(target.dataset.scrollTo ?? '')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || (event.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return
      const open = viewer && !viewer.hidden
      if (event.key === 'Escape' && open) {
        event.preventDefault()
        closeGallery()
        return
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      if (!open && document.body.classList.contains('is-sheet-open')) return
      const track = open ? viewer.querySelector<HTMLElement>('[data-gallery-track]') : inline
      if (track && track.offsetParent !== null) {
        event.preventDefault()
        stepGallery(track, event.key === 'ArrowRight' ? 1 : -1)
      }
    }
    root.addEventListener('click', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      cleanups.forEach((cleanup) => cleanup())
      root.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('is-gallery-open')
    }
  }, [])

  return <div ref={rootRef}>{children}</div>
}

/** Нижня кнопка картки набору й шторка «Де купити». */
export function MiniOffersCta({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  return (
    <>
      <div className="c-set-cta">
        <button type="button" className="c-set-cta__button" onClick={() => setOpen(true)}>
          {label}
        </button>
      </div>
      <MiniSheet open={open} label="Де купити" onClose={close}>
        {children}
      </MiniSheet>
    </>
  )
}
