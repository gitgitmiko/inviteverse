/**
 * Generate src/themes/nature-family/natureLayouts.generated.ts from scrape detect.
 * Run: node scripts/detect-nature-layouts.mjs && node scripts/generate-nature-layouts.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const src = path.join(ROOT, 'reference', 'nature-layout-detect.json')
const data = JSON.parse(fs.readFileSync(src, 'utf8'))

const lines = [
  '/** Auto-generated from scrape — jangan edit manual.',
  ' * Regenerate: node scripts/detect-nature-layouts.mjs && node scripts/generate-nature-layouts.mjs',
  ` * Generated: ${data.generatedAt}`,
  ' */',
  '',
  'export type NatureLayoutFlags = {',
  '  showMarquee: boolean',
  "  eventsVariant: 'overlay' | 'split'",
  "  storyVariant: 'text' | 'lux'",
  '  mapsEmbed: boolean',
  '  verseInCouple: boolean',
  "  coupleReveal: 'simple' | 'granular'",
  '  galleryAfterStory: boolean',
  "  timelineVariant: 'list' | 'conference'",
  "  giftVariant: 'toggle' | 'cards'",
  "  thankVariant: 'text' | 'photo-pill'",
  "  galleryAnim: 'zoom' | 'alternate'",
  '  showProtocolNote: boolean',
  '  showLiveStreaming: boolean',
  '}',
  '',
  'export const NATURE_LAYOUTS = {',
]

for (const [id, row] of Object.entries(data.themes)) {
  if (!row || !row.layout) continue
  const L = row.layout
  lines.push(`  '${id}': {`)
  lines.push(`    showMarquee: ${L.showMarquee},`)
  lines.push(`    eventsVariant: '${L.eventsVariant}',`)
  lines.push(`    storyVariant: '${L.storyVariant}',`)
  lines.push(`    mapsEmbed: ${L.mapsEmbed},`)
  lines.push(`    verseInCouple: ${L.verseInCouple},`)
  lines.push(`    coupleReveal: '${L.coupleReveal}',`)
  lines.push(`    galleryAfterStory: ${L.galleryAfterStory},`)
  lines.push(`    timelineVariant: '${L.timelineVariant}',`)
  lines.push(`    giftVariant: '${L.giftVariant}',`)
  lines.push(`    thankVariant: '${L.thankVariant}',`)
  lines.push(`    galleryAnim: '${L.galleryAnim}',`)
  lines.push(`    showProtocolNote: ${L.showProtocolNote},`)
  lines.push(`    showLiveStreaming: ${L.showLiveStreaming},`)
  lines.push(`  },`)
}

lines.push('} as const satisfies Record<string, NatureLayoutFlags>')
lines.push('')

const dest = path.join(ROOT, 'src', 'themes', 'nature-family', 'natureLayouts.generated.ts')
fs.writeFileSync(dest, lines.join('\n'))
console.log('Wrote', dest)
