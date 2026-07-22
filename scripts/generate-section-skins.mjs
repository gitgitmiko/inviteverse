/**
 * Generate sectionSkins.ts from scrape-section-styles/ALL.json
 */
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(import.meta.dirname, '..')
const ALL = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, 'reference/scrape-section-styles/ALL.json'),
    'utf8',
  ),
)

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function tone(bg) {
  const s = String(bg).toLowerCase()
  if (
    s.includes('#fff') ||
    s.includes('#f6') ||
    s.includes('#f5') ||
    s.includes('#f7') ||
    s.includes('#ece') ||
    s.includes('#dce') ||
    s.includes('#ffffff')
  ) {
    return 'dark'
  }
  // heading token often white text color used as BG (islamic events)
  if (s === 'var(--color-heading)') return 'dark'
  if (s === 'var(--color-primary)') return 'dark'
  if (s === 'var(--color-other)' && !s.includes('linear')) return 'light'
  return 'light'
}

let out = `/** Auto-generated from reference/scrape-section-styles — jangan edit manual.
 * Regenerate: node scripts/generate-section-skins.mjs
 */
import type { NatureThemeId } from './natureSkins'

export type SectionSkinStyle = {
  background: string
  onAccent?: 'light' | 'dark'
}

export type NatureSectionSkins = {
  header: SectionSkinStyle
  couple: SectionSkinStyle
  intro: SectionSkinStyle
  events: SectionSkinStyle & { cardRadius: string }
  story: SectionSkinStyle
  gift: SectionSkinStyle
  rsvp: SectionSkinStyle
  gallery: SectionSkinStyle
  footer: SectionSkinStyle
}

export const SECTION_SKINS: Record<NatureThemeId, NatureSectionSkins> = {
`

for (const [id, row] of Object.entries(ALL)) {
  const sec = row.sections || {}
  const pick = (k, fallback) => sec[k]?.css || fallback
  const header = pick('header', 'var(--color-secondary)')
  const couple = pick('couple', 'var(--color-primary)')
  const events = pick('events', 'var(--color-secondary)')
  const story = pick('story', 'var(--color-primary)')
  const gift = pick('gift', 'var(--color-secondary)')
  const rsvp = pick('rsvp', events)
  const gallery = pick('gallery', 'var(--color-primary)')
  const footer = pick('footer', 'var(--color-secondary)')
  const intro = story
  const cardR = sec.events?.cardRadius || '14px'

  out += `  '${id}': {
    header: { background: '${esc(header)}', onAccent: '${tone(header)}' },
    couple: { background: '${esc(couple)}' },
    intro: { background: '${esc(intro)}' },
    events: { background: '${esc(events)}', onAccent: '${tone(events)}', cardRadius: '${esc(cardR)}' },
    story: { background: '${esc(story)}' },
    gift: { background: '${esc(gift)}', onAccent: '${tone(gift)}' },
    rsvp: { background: '${esc(rsvp)}', onAccent: '${tone(rsvp)}' },
    gallery: { background: '${esc(gallery)}' },
    footer: { background: '${esc(footer)}', onAccent: '${tone(footer)}' },
  },
`
}

out += `}
`

const dest = path.join(ROOT, 'src/themes/nature-family/sectionSkins.ts')
fs.writeFileSync(dest, out)
console.log('Wrote', dest)
