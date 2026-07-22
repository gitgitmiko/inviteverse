import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(import.meta.dirname, '..')
const ids = [
  'pink-envelope',
  'java-emerald',
  'java-atelier',
  'maso-rustic',
  'islamic-eternal',
  'islamic-serenity',
  'islamic-pure',
  'chinese-red',
]

function head(rel, maxBytes = 200_000) {
  const p = path.join(ROOT, rel)
  const fd = fs.openSync(p, 'r')
  const buf = Buffer.alloc(maxBytes)
  const n = fs.readSync(fd, buf, 0, maxBytes, 0)
  fs.closeSync(fd)
  return buf.toString('utf8', 0, n)
}

function fontBlock(html) {
  const h1 = html.match(/h1,\s*\n?\s*h2[^\{]*\{[^}]*font-family:\s*([^;]+)/i)
  const h3 = html.match(/h3,button\s*\{[^}]*font-family:\s*([^;]+)/i)
  const body = html.match(/body,\s*p\s*\{[^}]*font-family:\s*([^;]+)/i)
  const vars = {}
  for (const m of html.matchAll(/(--color-[a-z]+)\s*:\s*([^;]+);/gi)) {
    if (!(m[1] in vars)) vars[m[1]] = m[2].trim()
  }
  const overlay = html.match(
    /\.overlayy[^\{]*\{[^}]*background-image:\s*([^;}]+)/i,
  )
  const overlayInline = html.match(
    /overlayy[^>]*style=["'][^"']*background-image:\s*([^;"']+)/i,
  )
  const extras = []
  const re = /\.cover-section\.cover-opened\s+(\.[a-z0-9_.\s>-]+)\s*\{([^}]+)\}/gi
  let m
  while ((m = re.exec(html))) {
    const sel = m[1].replace(/\s+/g, ' ').trim()
    if (/\.orn-[1-4]\b|\.cover-wrapper\b/.test(sel)) continue
    extras.push({ selector: sel, css: m[2].replace(/\s+/g, ' ').trim() })
  }
  // cover photo frame from CSS or inline
  const photoCss =
    html.match(
      /\.(?:sampul_aes|sampul_redsence|sampul_aesflo|foto_sampul)[^{]*\{([^}]+)\}/i,
    ) || html.match(/foto_sampul_cli[\s\S]{0,180}?style=["']([^"']+)/i)
  let photo = null
  if (photoCss) {
    const s = photoCss[1]
    const w = /width:\s*([^;]+)/i.exec(s)
    const h = /height:\s*([^;]+)/i.exec(s)
    const br = /border-radius:\s*([^;]+)/i.exec(s)
    if (w && h) {
      photo = {
        width: w[1].trim(),
        height: h[1].trim(),
        borderRadius: br ? br[1].trim() : '0',
      }
    }
  }
  // couple frames
  const couple =
    html.match(
      /\.mempelai-(?:pria|wanita)[^{]*\{[^}]*border-radius:\s*([^;]+)/i,
    ) ||
    html.match(
      /id=["'](?:groom|bride)[^"']*["'][^>]*style=["'][^"']*border-radius:\s*([^;"']+)/i,
    )

  return {
    h1: h1?.[1]?.trim().replace(/"/g, '') || null,
    h3: h3?.[1]?.trim().replace(/"/g, '') || null,
    body: body?.[1]?.trim().replace(/"/g, '') || null,
    colors: vars,
    overlay: overlay?.[1]?.trim() || overlayInline?.[1]?.trim() || null,
    extrasCount: extras.length,
    extras: extras.slice(0, 12),
    photo,
    coupleRadius: couple?.[1]?.trim() || null,
  }
}

function suggestAnim(extras) {
  if (!extras.length) return 'slide-x'
  const css = extras.map((e) => e.css).join(' ')
  const y = (css.match(/translateY/gi) || []).length
  const x = (css.match(/translateX/gi) || []).length
  const up = /translateY\s*\(\s*-/i.test(css)
  if (y >= 1 && x === 0 && !up) return extras.length >= 3 ? 'sink-down' : 'sink-soft'
  if (x >= 1 && y === 0) return 'sweep-side'
  if (up && x >= 1) return 'burst-split'
  if (up) return 'burst-lift'
  if (x >= 1 && y >= 1) return 'burst-mix'
  return 'slide-x'
}

function mapFont(name) {
  if (!name) return null
  const n = name.split(',')[0].trim()
  const map = {
    Christmas: "'Great Vibes', cursive",
    Playful: "'Architects Daughter', cursive",
    Basmala: "'Mr De Haviland', cursive",
    Spell: "'Orelega One', Georgia, serif",
  }
  if (map[n]) return map[n]
  const rest = name.includes(',') ? name.slice(name.indexOf(',')) : ', cursive'
  return `'${n}'${rest.includes('sans') ? ', system-ui, sans-serif' : rest.includes('serif') ? ', Georgia, serif' : ', cursive'}`
}

for (const id of ids) {
  const rel = `reference/scrape-batch-100/themes/${id}/page.html`
  if (!fs.existsSync(path.join(ROOT, rel))) {
    console.log(id, 'MISSING page.html')
    continue
  }
  const info = fontBlock(head(rel))
  const anim = suggestAnim(info.extras)
  console.log('\n===', id, '===')
  console.log(
    JSON.stringify(
      {
        colors: info.colors,
        h1: info.h1,
        body: info.body,
        display: mapFont(info.h1),
        bodyFont: mapFont(info.body) || mapFont(info.h3),
        overlay: info.overlay,
        anim,
        extras: info.extrasCount,
        photo: info.photo,
        coupleRadius: info.coupleRadius,
      },
      null,
      2,
    ),
  )
}
