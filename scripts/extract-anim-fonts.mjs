import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'reference', 'scrape-anim-fonts')
fs.mkdirSync(OUT, { recursive: true })

const ids = [
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
]

const deep = {
  'classic-devotion': 'reference/scrape-2026-07-22-deep/classic-devotion-509.html',
  'red-essence': 'reference/scrape-2026-07-22-deep/red-essence-508.html',
  'snow-blue': 'reference/scrape-2026-07-22-deep/snow-blue-507.html',
  'snow-pink': 'reference/scrape-2026-07-22-deep/snow-pink-506.html',
}

function head(rel, maxBytes = 180_000) {
  const p = path.join(ROOT, rel)
  const fd = fs.openSync(p, 'r')
  const buf = Buffer.alloc(maxBytes)
  const n = fs.readSync(fd, buf, 0, maxBytes, 0)
  fs.closeSync(fd)
  return buf.toString('utf8', 0, n)
}

function fontBlock(html) {
  const google = [...html.matchAll(/fonts\.googleapis\.com\/css2\?([^"'\s>]+)/gi)].flatMap(
    (m) =>
      decodeURIComponent(m[1])
        .split('&')
        .filter((x) => x.startsWith('family='))
        .map((x) => x.slice(7).split(':')[0].replace(/\+/g, ' ')),
  )
  const h1 = html.match(/h1,\s*\n?\s*h2[^\{]*\{[^}]*font-family:\s*([^;]+)/i)
  const h3 = html.match(/h3,button\s*\{[^}]*font-family:\s*([^;]+)/i)
  const body = html.match(/body,\s*p\s*\{[^}]*font-family:\s*([^;]+)/i)
  return {
    google: [...new Set(google)].filter((g) => g && g !== 'Material Icons'),
    h1: h1?.[1]?.trim().replace(/"/g, '') || null,
    h3: h3?.[1]?.trim().replace(/"/g, '') || null,
    body: body?.[1]?.trim().replace(/"/g, '') || null,
  }
}

function coverExtras(html) {
  const extras = []
  const re = /\.cover-section\.cover-opened\s+(\.[a-z0-9_.\s>-]+)\s*\{([^}]+)\}/gi
  let m
  while ((m = re.exec(html))) {
    const sel = m[1].replace(/\s+/g, ' ').trim()
    if (/\.orn-[1-4]\b|\.cover-wrapper\b/.test(sel)) continue
    extras.push({
      selector: sel,
      css: m[2].replace(/\s+/g, ' ').trim(),
    })
  }
  return extras
}

function suggestAnim(extras) {
  if (!extras.length) return 'slide-x'
  const css = extras.map((e) => e.css).join(' ')
  const y = (css.match(/translateY/gi) || []).length
  const x = (css.match(/translateX/gi) || []).length
  const op = /opacity/i.test(css)
  if (y >= 3 && x === 0) return 'float-up'
  if (y >= 1 && x === 0 && extras.length <= 2) return 'rise-soft'
  if (x >= 1 && y === 0) return 'sweep-side'
  if (x >= 2 && y >= 2) return 'burst-out'
  if (y >= 1 && x >= 1) return 'burst-out'
  if (op && y >= 1) return 'float-fade'
  return 'slide-x'
}

/** Map custom Indoinvite fonts → Google Fonts we can load. */
function mapFonts(f) {
  const custom = {
    Christmas: { display: "'Great Vibes', cursive", note: 'Christmas Bell → Great Vibes' },
    Playful: { display: "'Architects Daughter', cursive", note: 'Playful → Architects Daughter' },
    Basmala: { display: "'Mr De Haviland', cursive", note: 'Basmala → Mr De Haviland' },
    Spell: { display: "'Lavishly Yours', cursive", note: 'Spell unused as primary' },
  }
  let display = f.h1
  let body = f.body || f.h3 || 'Assistant, sans-serif'
  let note = ''

  if (display && custom[display.split(',')[0].trim()]) {
    const c = custom[display.split(',')[0].trim()]
    display = c.display
    note = c.note
  } else if (display) {
    const name = display.split(',')[0].trim()
    const fallback = display.includes(',') ? display : null
    display = `'${name}'${fallback ? '' : display.toLowerCase().includes('serif') ? ', serif' : display.toLowerCase().includes('sans') ? ', sans-serif' : ', cursive'}`
    // fix double
    if (display.includes("'") && display.match(/'/g).length === 2) {
      /* ok */
    }
  } else {
    display = "'Dancing Script', cursive"
  }

  // normalize body
  const bodyName = body.split(',')[0].trim().replace(/"/g, '')
  body = `'${bodyName}', system-ui, sans-serif`

  // h3 playful used as accent — ignore for body
  if (bodyName === 'Playful') body = "'Assistant', system-ui, sans-serif"

  return { display, body, note, scraped: f }
}

const all = {}
for (const id of ids) {
  const rel = deep[id] || `reference/scrape-batch-100/themes/${id}/page.html`
  const html = head(rel)
  const fonts = fontBlock(html)
  const extras = coverExtras(html)
  const anim = suggestAnim(extras)
  const mapped = mapFonts(fonts)
  const row = {
    id,
    openAnimSuggested: anim,
    extrasCount: extras.length,
    extras: extras.slice(0, 15),
    fontsScraped: fonts,
    fontsMapped: mapped,
  }
  all[id] = row
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(row, null, 2))
  console.log(
    `${id.padEnd(18)} anim=${anim.padEnd(12)} extras=${String(extras.length).padStart(2)}  h1=${fonts.h1 || '-'}  body=${fonts.body || '-'}  → ${mapped.display}`,
  )
}

fs.writeFileSync(path.join(OUT, 'ALL.json'), JSON.stringify(all, null, 2))
console.log('\nOK', OUT)
