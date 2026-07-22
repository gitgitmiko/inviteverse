import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'reference', 'scrape-section-styles')

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

const deep = {
  'classic-devotion': 'reference/scrape-2026-07-22-deep/classic-devotion-509.html',
  'red-essence': 'reference/scrape-2026-07-22-deep/red-essence-508.html',
  'snow-blue': 'reference/scrape-2026-07-22-deep/snow-blue-507.html',
  'snow-pink': 'reference/scrape-2026-07-22-deep/snow-pink-506.html',
}

function read(id) {
  const rel = deep[id] || `reference/scrape-batch-100/themes/${id}/page.html`
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

/** Inline style after class containing cls — handles nested url('...') quotes */
function inlineAfterClass(html, cls) {
  const marker = `class="`
  let from = 0
  while (true) {
    const i = html.indexOf(marker, from)
    if (i < 0) return null
    const endClass = html.indexOf('"', i + marker.length)
    const classVal = html.slice(i + marker.length, endClass)
    if (!classVal.includes(cls)) {
      from = endClass + 1
      continue
    }
    const chunk = html.slice(endClass, endClass + 2200)
    const si = chunk.indexOf('style="')
    if (si < 0) {
      from = endClass + 1
      continue
    }
    // find closing " that ends style attr — after >; allow newlines
    let j = si + 7
    let style = ''
    while (j < chunk.length) {
      const c = chunk[j]
      if (c === '"' && chunk[j - 1] !== '\\') {
        // could be end of style if next non-space is > or letter (attr)
        const rest = chunk.slice(j + 1, j + 20).trimStart()
        if (rest.startsWith('>') || /^[a-zA-Z-]+=/.test(rest) || rest === '') {
          break
        }
      }
      style += c
      j++
      if (style.length > 1800) break
    }
    return style.replace(/\s+/g, ' ').trim()
  }
}

function dims(style) {
  if (!style) return null
  const w = (style.match(/\bwidth:\s*([^;]+)/i) || [])[1]
  const h = (style.match(/\b(?:min-)?height:\s*([^;]+)/i) || [])[1]
  const br = (style.match(/border-radius:\s*([^;]+)/i) || [])[1]
  const oo = (style.match(/outline-offset:\s*([^;]+)/i) || [])[1]
  return {
    width: w?.trim() || null,
    height: h?.trim() || null,
    borderRadius: br?.trim() || null,
    outlineOffset: oo?.trim() || null,
  }
}

function inferShape(br) {
  if (!br) return { layout: 'centered', photoShape: 'pill' }
  if (/30px\s+200px|200px\s+30px/i.test(br)) {
    return { layout: 'band', photoShape: 'arch-asymmetric' }
  }
  if (/200px\s+200px\s+0/i.test(br)) {
    return { layout: 'centered', photoShape: 'arch-top' }
  }
  if (/^\s*200px\s*$/i.test(br) || /^200px(\s+200px){1,3}\s*$/i.test(br)) {
    return { layout: 'centered', photoShape: 'pill' }
  }
  if (/^\s*(0|0px|5px|8px|10px|12px|15px)\s*$/i.test(br)) {
    return { layout: 'centered', photoShape: 'rounded-rect' }
  }
  if (/^\s*0\s*$/i.test(br)) {
    return { layout: 'band', photoShape: 'rect' }
  }
  return { layout: 'centered', photoShape: 'rounded-rect' }
}

function eventCardRadius(html) {
  const patterns = [
    /\.acara-section[^{]*\{[^}]*border-radius:\s*([^;]+)/i,
    /\.event-card[^{]*\{[^}]*border-radius:\s*([^;]+)/i,
    /\.acara-wrapper\s+\.body[^{]*\{[^}]*border-radius:\s*([^;]+)/i,
    /border-radius:\s*(30px\s+0\s+30px\s+0)/i,
    /border-radius:\s*(20px)\s*;[^}]*acara/i,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m) return m[1].trim()
  }
  // search near .acara-body or similar
  const m2 = html.match(
    /\.(?:acara|event)[a-z_-]*\s*\{[^}]{0,300}border-radius:\s*([^;]+)/i,
  )
  return m2 ? m2[1].trim() : null
}

const frames = {}
for (const id of IDS) {
  const html = read(id)
  const g = dims(inlineAfterClass(html, 'foto-pria'))
  const b = dims(inlineAfterClass(html, 'foto-wanita'))
  const cover = dims(inlineAfterClass(html, 'sampul_')) || dims(inlineAfterClass(html, 'foto_sampul'))
  const shape = inferShape(g?.borderRadius || b?.borderRadius || '')
  const cardR = eventCardRadius(html)

  // merge into existing ALL.json section file
  const file = path.join(OUT, `${id}.json`)
  const prev = JSON.parse(fs.readFileSync(file, 'utf8'))
  prev.couple = {
    ...shape,
    groom: g,
    bride: b,
  }
  prev.coverPhoto = cover
  if (prev.sections?.events) {
    prev.sections.events.cardRadius = cardR || prev.sections.events.cardRadius
  }
  frames[id] = prev
  fs.writeFileSync(file, JSON.stringify(prev, null, 2))
  console.log(
    `${id.padEnd(18)} ${shape.layout}/${shape.photoShape} ${g?.width}×${g?.height} r=${g?.borderRadius || '-'} card=${cardR || '-'}`,
  )
}

fs.writeFileSync(path.join(OUT, 'ALL.json'), JSON.stringify(frames, null, 2))
console.log('updated', OUT)
