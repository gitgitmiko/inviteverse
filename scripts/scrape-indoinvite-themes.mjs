/**
 * Scrape Indoinvite theme demos for Invite VERSE parity.
 * - Cover: layout, photo frame, overlay, open animation, typography colors
 * - Sections: order, frames, AOS/data-anim, key CSS
 * - SKIP downloading nikah/template/* ornament assets (URL+slot only)
 *
 * Usage: node scripts/scrape-indoinvite-themes.mjs [--limit=100] [--offset=0]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CATALOG = path.join(ROOT, 'reference/scrape-catalog/themes-catalog.json')

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.split('=')[1] : fallback
}

/** Output folder — default batch-100; e.g. --out=reference/scrape-batch-200 */
const OUT = path.join(ROOT, arg('out', 'reference/scrape-batch-100'))

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res.text()
}

function pickCssVars(html) {
  const vars = {}
  const re = /(--color-[a-z-]+)\s*:\s*([^;]+);/gi
  let m
  while ((m = re.exec(html))) {
    const k = m[1]
    if (!(k in vars)) vars[k] = m[2].trim()
  }
  return vars
}

function pickFonts(html) {
  const set = new Set()
  const re = /font-family:\s*([^;}{]+)/gi
  let m
  while ((m = re.exec(html))) {
    const v = m[1].trim().replace(/\s+/g, ' ')
    if (v.length < 80) set.add(v)
  }
  return [...set].slice(0, 24)
}

function extractCover(html) {
  const idx = html.search(/class=["'][^"']*cover-section/i)
  if (idx < 0) return { found: false }
  const end = html.indexOf('header-section', idx)
  const chunk = html.slice(idx, end > idx ? end : idx + 12000)

  const photo = {}
  const sampul =
    /foto_sampul_cli[\s\S]{0,200}?style=["']([^"']+)["']/i.exec(chunk) ||
    /sampul_(?:redsence|aes|aesflo|rose)[^"']*["'][^>]*style=["']([^"']+)["']/i.exec(
      chunk,
    )
  if (sampul) {
    const s = sampul[1]
    photo.rawStyle = s.replace(/\s+/g, ' ').slice(0, 500)
    const w = /width:\s*([^;]+)/i.exec(s)
    const h = /height:\s*([^;]+)/i.exec(s)
    const br = /border-radius:\s*([^;]+)/i.exec(s)
    const oo = /outline-offset:\s*([^;]+)/i.exec(s)
    if (w) photo.width = w[1].trim()
    if (h) photo.height = h[1].trim()
    if (br) photo.borderRadius = br[1].trim()
    if (oo) photo.outlineOffset = oo[1].trim()
    photo.hasInsetFrame = true
  } else {
    photo.hasInsetFrame = false
  }

  const overlay = /overlayy[^>]*style=["']([^"']+)["']/i.exec(chunk)
  const eyebrow =
    /id=["']awal-fun-h3-id1["'][^>]*style=["']([^"']*)["'][^>]*>([^<]+)/i.exec(
      chunk,
    ) ||
    /id=["']awal-fun-h3-id1["'][^>]*>([^<]+)/i.exec(chunk)

  const ornSlots = []
  const ornRe = /class=["'][^"']*\born-(\d+)\b[^"']*["']/gi
  let om
  while ((om = ornRe.exec(chunk))) {
    ornSlots.push(`orn-${om[1]}`)
  }

  const templateOrns = [
    ...chunk.matchAll(/https?:\/\/[^"'\\\s]+nikah\/template\/[^"'\\\s]+/gi),
  ].map((x) => x[0])

  return {
    found: true,
    hasInsetFrame: !!photo.hasInsetFrame,
    photo: photo.hasInsetFrame ? photo : null,
    overlay: overlay ? overlay[1].replace(/\s+/g, ' ').slice(0, 300) : null,
    eyebrow: eyebrow
      ? {
          style: (eyebrow[1] || '').slice(0, 120),
          text: (eyebrow[2] || eyebrow[1] || '').trim().slice(0, 80),
        }
      : null,
    coverOrnClassHints: [...new Set(ornSlots)].slice(0, 20),
    indoinviteOrnamentUrlsSkipped: [...new Set(templateOrns)].slice(0, 30),
    coverHtmlBytes: chunk.length,
  }
}

function extractSections(html) {
  const sectionRe =
    /<(?:section|div)[^>]*class=["']([^"']*?(?:-section|box-\d)[^"']*)["'][^>]*>/gi
  const sections = []
  let m
  while ((m = sectionRe.exec(html))) {
    const cls = m[1]
    if (/cover-section/i.test(cls)) continue
    sections.push(cls.split(/\s+/).filter(Boolean).slice(0, 6).join(' '))
  }
  return [...new Set(sections)].slice(0, 40)
}

function extractFrames(html) {
  const frames = []
  const patterns = [
    /foto-pria-s[^>]*style=["']([^"']+)["']/i,
    /foto-wanita-s[^>]*style=["']([^"']+)["']/i,
    /sampul_(?:redsence|aes)[^>]*style=["']([^"']+)["']/i,
  ]
  for (const re of patterns) {
    const hit = re.exec(html)
    if (!hit) continue
    const s = hit[0]
    const kind = /foto-pria/i.test(s)
      ? 'groom'
      : /foto-wanita/i.test(s)
        ? 'bride'
        : 'cover'
    const style = hit[1].replace(/\s+/g, ' ')
    frames.push({
      kind,
      width: (/width:\s*([^;]+)/i.exec(style) || [])[1]?.trim() || null,
      height: (/height:\s*([^;]+)/i.exec(style) || [])[1]?.trim() || null,
      borderRadius:
        (/border-radius:\s*([^;]+)/i.exec(style) || [])[1]?.trim() || null,
      border: (/border:\s*([^;]+)/i.exec(style) || [])[1]?.trim() || null,
      styleSnippet: style.slice(0, 280),
    })
  }
  return frames
}

function extractAnimations(html) {
  const aos = new Set()
  const anim = new Set()
  let m
  const aosRe = /data-aos=["']([^"']+)["']/gi
  while ((m = aosRe.exec(html))) aos.add(m[1])
  const animRe = /data-anim=["']([^"']+)["']/gi
  while ((m = animRe.exec(html))) anim.add(m[1])
  const hasCoverOpened = /cover-opened/i.test(html)
  const hasPureSnow = /PureSnow/i.test(html)
  const hasSplide = /splide/i.test(html)
  const hasGsap = /gsap/i.test(html)
  return {
    aos: [...aos].slice(0, 30),
    dataAnim: [...anim].slice(0, 30),
    coverOpenedClass: hasCoverOpened,
    pureSnow: hasPureSnow,
    splide: hasSplide,
    gsap: hasGsap,
  }
}

function detectLayoutEngine(html) {
  if (/elegan-nature/i.test(html)) return 'elegan-nature'
  if (/super-classic/i.test(html)) return 'super-classic'
  if (/elegan-grey/i.test(html)) return 'elegan-grey'
  if (/blue-flowers/i.test(html)) return 'blue-flowers'
  const tmpl = /nikah\/template\/([a-z0-9\-]+)\//i.exec(html)
  return tmpl ? tmpl[1] : 'unknown'
}

function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function scrapeOne(theme) {
  const url = `https://indoinvite.com/s/1952/undangan/${theme.id}?kpd=Bapak%20Budi&contoh=1`
  const html = await fetchText(url)
  const colors = pickCssVars(html)
  const cover = extractCover(html)
  const parity = {
    id: theme.slug || slugify(theme.name),
    label: theme.name,
    sourceId: String(theme.id),
    source: url,
    scrapedAt: new Date().toISOString().slice(0, 10),
    layoutEngine: detectLayoutEngine(html),
    colors,
    fonts: pickFonts(html),
    cover,
    sections: extractSections(html),
    photoFrames: extractFrames(html),
    animations: extractAnimations(html),
    htmlBytes: html.length,
    note: 'Ornamen nikah/template tidak diunduh — hanya URL/slot dicatat di cover.indoinviteOrnamentUrlsSkipped',
  }

  const dir = path.join(OUT, 'themes', parity.id)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'parity.json'), JSON.stringify(parity, null, 2))
  // cover snippet only (not full HTML — save space); keep full if < 600kb
  const cidx = html.search(/class=["'][^"']*cover-section/i)
  if (cidx >= 0) {
    const cend = html.indexOf('header-section', cidx)
    const coverHtml = html.slice(cidx, cend > cidx ? cend : cidx + 10000)
    fs.writeFileSync(path.join(dir, 'cover-snippet.html'), coverHtml)
  }
  if (html.length < 650000) {
    fs.writeFileSync(path.join(dir, 'page.html'), html)
  } else {
    fs.writeFileSync(
      path.join(dir, 'page-meta.txt'),
      `htmlBytes=${html.length}; full HTML skipped (too large)\n`,
    )
  }
  return parity
}

async function main() {
  const limit = Number(arg('limit', '100'))
  const offset = Number(arg('offset', '0'))
  const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'))
  const batch = catalog
    .sort((a, b) => a.num - b.num)
    .slice(offset, offset + limit)

  fs.mkdirSync(OUT, { recursive: true })
  const index = []
  const errors = []

  console.log(`Scraping ${batch.length} themes (offset=${offset}) → ${OUT}`)

  for (let i = 0; i < batch.length; i++) {
    const t = batch[i]
    const slug = t.slug || slugify(t.name)
    process.stdout.write(`[${i + 1}/${batch.length}] ${slug} (#${t.id}) ... `)
    try {
      const parity = await scrapeOne({ ...t, slug })
      index.push({
        num: t.num,
        id: parity.id,
        sourceId: parity.sourceId,
        label: parity.label,
        layoutEngine: parity.layoutEngine,
        hasCoverFrame: !!parity.cover?.hasInsetFrame,
        coverPhoto: parity.cover?.photo
          ? {
              w: parity.cover.photo.width,
              h: parity.cover.photo.height,
              r: parity.cover.photo.borderRadius,
            }
          : null,
        sectionCount: parity.sections.length,
      })
      console.log(
        `OK engine=${parity.layoutEngine} coverFrame=${parity.cover?.hasInsetFrame}`,
      )
    } catch (e) {
      console.log(`FAIL ${e.message}`)
      errors.push({ id: t.id, name: t.name, error: String(e.message || e) })
    }
    await sleep(400)
  }

  const summary = {
    scrapedAt: new Date().toISOString(),
    requested: batch.length,
    ok: index.length,
    failed: errors.length,
    withCoverFrame: index.filter((x) => x.hasCoverFrame).length,
    engines: index.reduce((acc, x) => {
      acc[x.layoutEngine] = (acc[x.layoutEngine] || 0) + 1
      return acc
    }, {}),
    themes: index,
    errors,
  }
  fs.writeFileSync(path.join(OUT, 'INDEX.json'), JSON.stringify(summary, null, 2))
  fs.writeFileSync(
    path.join(OUT, 'README.md'),
    `# Scrape batch (${summary.ok}/${summary.requested})

Scraped: ${summary.scrapedAt}

## Rules
- Cover + sections: layout, frames, animations, CSS vars
- **Skip** downloading \`nikah/template/\` ornament binaries
- Free ornaments mapped later per slot

## Engines
${Object.entries(summary.engines)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}

## Cover inset frames
${summary.withCoverFrame} / ${summary.ok} themes have inset cover photo frames.

See \`themes/<slug>/parity.json\` per theme.
`,
  )

  console.log('\nDone.', summary.ok, 'ok,', summary.failed, 'failed')
  console.log('Cover frames:', summary.withCoverFrame)
  console.log('Engines:', summary.engines)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
