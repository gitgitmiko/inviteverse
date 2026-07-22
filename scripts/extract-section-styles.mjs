/**
 * Extract per-section backgrounds + couple/cover frames from scraped page.html
 * for all wired nature themes. Writes reference/scrape-section-styles/ALL.json
 */
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'reference', 'scrape-section-styles')
fs.mkdirSync(OUT, { recursive: true })

const IDS = [
  'classic-devotion',
  'red-essence',
  'snow-blue',
  'snow-pink',
  'burgundy-pure',
  'bear-brown',
  'infinite-gallop',
  'sun-moon',
  'royal-mega',
  'retro-romance',
  'padang-red',
  'nea-pure',
  'pink-envelope',
  'java-emerald',
  'java-atelier',
  'maso-rustic',
  'islamic-eternal',
  'islamic-serenity',
  'islamic-pure',
  'chinese-red',
]

const SECTION_MAP = {
  'header-section': 'header',
  'couple-section': 'couple',
  'acara-section': 'events',
  'story-section': 'story',
  'venue-section': 'gift', // often gift/maps area
  'rsvp-section': 'rsvp',
  'thank-section': 'footer',
  'fh5co-section-gray': 'gallery',
}

function findHtml(id) {
  const deep = {
    'classic-devotion': 'reference/scrape-2026-07-22-deep/classic-devotion-509.html',
    'red-essence': 'reference/scrape-2026-07-22-deep/red-essence-508.html',
    'snow-blue': 'reference/scrape-2026-07-22-deep/snow-blue-507.html',
    'snow-pink': 'reference/scrape-2026-07-22-deep/snow-pink-506.html',
  }
  const rel = deep[id] || `reference/scrape-batch-100/themes/${id}/page.html`
  const p = path.join(ROOT, rel)
  if (!fs.existsSync(p)) return null
  // style block is early; couple CSS sometimes later — read up to 500kb
  const fd = fs.openSync(p, 'r')
  const buf = Buffer.alloc(500_000)
  const n = fs.readSync(fd, buf, 0, 500_000, 0)
  fs.closeSync(fd)
  return buf.toString('utf8', 0, n)
}

function parseDecl(block) {
  const out = {}
  const bg = /background(?:-color|-image)?\s*:\s*([^;}{]+)/i.exec(block)
  if (bg) out.background = bg[1].trim().replace(/\s+/g, ' ')
  const br = /border-radius\s*:\s*([^;}{]+)/i.exec(block)
  if (br) out.borderRadius = br[1].trim()
  const w = /(?:^|[^-])width\s*:\s*([^;}{]+)/i.exec(block)
  if (w) out.width = w[1].trim()
  const h = /(?:^|[^-])height\s*:\s*([^;}{]+)/i.exec(block)
  if (h) out.height = h[1].trim()
  const b = /(?:^|[;{])\s*border\s*:\s*([^;}{]+)/i.exec(block)
  if (b) out.border = b[1].trim()
  return out
}

function extractRule(html, selectorPart) {
  // Find CSS rules containing selectorPart
  const re = new RegExp(
    `([^{}@]{0,120}${selectorPart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{]*)\\{([^}]+)\\}`,
    'gi',
  )
  const hits = []
  let m
  while ((m = re.exec(html))) {
    const sel = m[1].replace(/\s+/g, ' ').trim()
    if (sel.length > 160) continue
    hits.push({ selector: sel, ...parseDecl(m[2]) })
  }
  return hits
}

function normalizeBg(raw, colors) {
  if (!raw) return null
  let s = raw.replace(/!important/gi, '').trim()
  // map var(--color-*) to token
  const varM = /var\((--color-[a-z]+)\)/i.exec(s)
  if (varM && !/url\(/i.test(s) && !/linear-gradient/i.test(s)) {
    return { type: 'token', value: varM[1].replace('--color-', '') }
  }
  if (/linear-gradient/i.test(s)) {
    // replace vars inside gradient with actual colors if possible
    let g = s
    for (const [k, v] of Object.entries(colors)) {
      g = g.replace(new RegExp(`var\\(${k}\\)`, 'gi'), v)
    }
    return { type: 'gradient', value: g }
  }
  if (/url\(/i.test(s)) {
    // licensed pattern — approximate with primary/secondary solid
    const hex = /#([0-9a-f]{3,8})\b/i.exec(s)
    return {
      type: 'pattern-approx',
      value: hex ? `#${hex[1]}` : colors['--color-primary'] || '#fff',
      note: 'Indoinvite pattern URL skipped; solid approx',
    }
  }
  if (/^#|^rgb|^hsl/i.test(s)) {
    return { type: 'solid', value: s.split(/\s/)[0] }
  }
  if (/transparent/i.test(s)) return { type: 'token', value: 'primary' }
  return { type: 'raw', value: s.slice(0, 120) }
}

function pickBestFrame(hits) {
  // prefer rules with both width and height
  const scored = hits
    .filter((h) => h.width || h.height || h.borderRadius)
    .sort((a, b) => {
      const sa = (a.width ? 2 : 0) + (a.height ? 2 : 0) + (a.borderRadius ? 1 : 0)
      const sb = (b.width ? 2 : 0) + (b.height ? 2 : 0) + (b.borderRadius ? 1 : 0)
      return sb - sa
    })
  return scored[0] || null
}

function extractColors(html) {
  const colors = {}
  const re = /(--color-[a-z]+)\s*:\s*([^;]+);/gi
  let m
  while ((m = re.exec(html))) {
    if (!(m[1] in colors)) colors[m[1]] = m[2].trim()
  }
  return colors
}

function toAppCss(norm) {
  if (!norm) return null
  if (norm.type === 'token') return `var(--color-${norm.value})`
  return norm.value
}

const all = {}
for (const id of IDS) {
  const html = findHtml(id)
  if (!html) {
    console.log('MISSING', id)
    continue
  }
  const colors = extractColors(html)
  const sections = {}
  for (const [cls, key] of Object.entries(SECTION_MAP)) {
    const hits = extractRule(html, cls)
    // prefer rule that sets background on the section itself
    const bgHit =
      hits.find((h) => h.background && new RegExp(cls).test(h.selector)) ||
      hits.find((h) => h.background)
    sections[key] = {
      background: normalizeBg(bgHit?.background, colors),
      css: toAppCss(normalizeBg(bgHit?.background, colors)),
      from: bgHit?.selector || null,
    }
  }

  // event card radius
  const eventHits = [
    ...extractRule(html, 'acara-wrapper'),
    ...extractRule(html, 'event-card'),
    ...extractRule(html, '.acara'),
  ]
  const card = eventHits.find((h) => h.borderRadius)
  sections.events = {
    ...sections.events,
    cardRadius: card?.borderRadius || null,
  }

  const groom = pickBestFrame([
    ...extractRule(html, 'foto-pria'),
    ...extractRule(html, 'mempelai-pria'),
    ...extractRule(html, 'groom'),
  ])
  const bride = pickBestFrame([
    ...extractRule(html, 'foto-wanita'),
    ...extractRule(html, 'mempelai-wanita'),
    ...extractRule(html, 'bride'),
  ])
  const coverPhoto = pickBestFrame([
    ...extractRule(html, 'sampul_'),
    ...extractRule(html, 'foto_sampul'),
    ...extractRule(html, 'sampul-aes'),
  ])

  // couple layout hint: asymmetric radii → band, pill 200px → centered pill
  let layout = 'centered'
  let photoShape = 'pill'
  const br = groom?.borderRadius || bride?.borderRadius || ''
  if (/30px\s+200px|200px\s+30px/i.test(br)) {
    layout = 'band'
    photoShape = 'arch-asymmetric'
  } else if (/200px\s+200px\s+0|200px 200px 0/i.test(br)) {
    photoShape = 'arch-top'
  } else if (/^10px|^12px|^8px|^0|^5px/i.test(br.trim())) {
    photoShape = 'rounded-rect'
  } else if (/200px/i.test(br) && !/30px/.test(br)) {
    photoShape = 'pill'
  } else if (/0px|0\s/.test(br) || br === '0') {
    layout = 'band'
    photoShape = 'rect'
  }

  const row = {
    id,
    colors,
    sections,
    couple: {
      layout,
      photoShape,
      groom: groom
        ? {
            width: groom.width,
            height: groom.height,
            borderRadius: groom.borderRadius,
            border: groom.border,
            selector: groom.selector,
          }
        : null,
      bride: bride
        ? {
            width: bride.width,
            height: bride.height,
            borderRadius: bride.borderRadius,
            border: bride.border,
            selector: bride.selector,
          }
        : null,
    },
    coverPhoto: coverPhoto
      ? {
          width: coverPhoto.width,
          height: coverPhoto.height,
          borderRadius: coverPhoto.borderRadius,
          selector: coverPhoto.selector,
        }
      : null,
  }
  all[id] = row
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(row, null, 2))
  console.log(
    `${id.padEnd(18)} couple=${layout}/${photoShape} ${groom?.width || '-'}×${groom?.height || '-'} r=${(groom?.borderRadius || '-').slice(0, 24)} | events.bg=${sections.events?.css?.slice(0, 40)} cardR=${sections.events?.cardRadius || '-'}`,
  )
}

fs.writeFileSync(path.join(OUT, 'ALL.json'), JSON.stringify(all, null, 2))
console.log('\nWrote', OUT)
