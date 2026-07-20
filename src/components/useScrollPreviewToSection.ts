import { useEffect, type RefObject } from 'react'
import type { SectionId } from '../lib/themeTypes'

export type PreviewFocusTarget = SectionId | 'cover'

/** Urutan fallback jika section tidak punya elemen terpisah di tema */
const SECTION_FALLBACKS: Record<string, string[]> = {
  cover: ['cover'],
  hero: ['hero'],
  intro: ['intro', 'hero'],
  couple: ['couple', 'hero'],
  events: ['events'],
  story: ['story'],
  timeline: ['timeline'],
  gift: ['gift'],
  rsvp: ['rsvp'],
  gallery: ['gallery'],
  footer: ['footer'],
}

export function findPreviewSectionEl(
  root: HTMLElement,
  target: PreviewFocusTarget,
): HTMLElement | null {
  const candidates = SECTION_FALLBACKS[target] ?? [target]
  for (const id of candidates) {
    const el = root.querySelector<HTMLElement>(`[data-section="${id}"]`)
    if (el) return el
  }
  return null
}

/**
 * Frame scroll preview — theme-agnostic.
 * Semua root tema harus punya data-theme-frame.
 */
function getPreviewScrollContainer(from: HTMLElement): HTMLElement | null {
  if (from.classList.contains('ed__preview') || from.dataset.previewRoot === '1') {
    return (
      from.querySelector<HTMLElement>('[data-theme-frame]') ??
      (from.firstElementChild as HTMLElement | null) ??
      from
    )
  }
  return (
    from.closest<HTMLElement>('[data-theme-frame]') ??
    from.closest<HTMLElement>('.ed__preview')
  )
}

function resolveSearchRoot(root: HTMLElement): HTMLElement {
  if (root.classList.contains('ed__preview') || root.dataset.previewRoot === '1') {
    return root
  }
  return (
    root.closest<HTMLElement>('.ed__preview') ??
    root.closest<HTMLElement>('[data-theme-frame]') ??
    root
  )
}

function scrollContainerToEl(
  container: HTMLElement,
  el: HTMLElement,
): boolean {
  const cRect = container.getBoundingClientRect()
  const eRect = el.getBoundingClientRect()
  const nextTop = eRect.top - cRect.top + container.scrollTop - 12

  // Layout belum siap: butuh scroll tapi container belum overflow
  if (nextTop > 16 && container.scrollHeight <= container.clientHeight + 2) {
    return false
  }

  container.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' })
  return true
}

/** Scroll preview ke section — return false agar di-retry jika belum siap */
export function scrollPreviewToSection(
  root: HTMLElement,
  target: PreviewFocusTarget,
): boolean {
  const searchRoot = resolveSearchRoot(root)
  const container = getPreviewScrollContainer(root) ?? searchRoot

  if (target === 'cover') {
    container.scrollTo({ top: 0, behavior: 'smooth' })
    return true
  }

  const el = findPreviewSectionEl(searchRoot, target)
  if (!el) return false

  return scrollContainerToEl(container, el)
}

/**
 * Saat focusSection / focusNonce berubah → arahkan preview.
 * Tidak mengunci scroll; hanya sekali per perubahan pilihan.
 */
export function useScrollPreviewToSection(
  rootRef: RefObject<HTMLElement | null>,
  focusSection: PreviewFocusTarget | null | undefined,
  focusNonce = 0,
  ready = true,
) {
  useEffect(() => {
    if (!focusSection || !ready) return

    let cancelled = false
    let attempts = 0
    const maxAttempts = 24
    const timers: number[] = []

    const tryScroll = () => {
      if (cancelled) return
      const root = rootRef.current
      if (!root) {
        scheduleRetry()
        return
      }

      const ok = scrollPreviewToSection(root, focusSection)
      if (!ok) scheduleRetry()
    }

    const scheduleRetry = () => {
      attempts += 1
      if (attempts < maxAttempts) {
        timers.push(window.setTimeout(tryScroll, 50 + attempts * 10))
      }
    }

    timers.push(
      window.setTimeout(() => {
        requestAnimationFrame(() => requestAnimationFrame(tryScroll))
      }, 50),
    )

    return () => {
      cancelled = true
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [rootRef, focusSection, focusNonce, ready])
}
