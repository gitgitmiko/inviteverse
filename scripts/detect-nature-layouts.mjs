/**
 * Detect Indoinvite layout flags from scraped page.html for nature-family themes.
 * Usage: node scripts/detect-nature-layouts.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const NATURE_IDS = [
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

const SCRAPE_ALIAS = {
  'islamic-eternal': 'eternal-islamic',
}

function findPage(themeId) {
  const folder = SCRAPE_ALIAS[themeId] || themeId
  for (const batch of ['scrape-batch-100', 'scrape-batch-200']) {
    const p = path.join(ROOT, 'reference', batch, 'themes', folder, 'page.html')
    if (fs.existsSync(p)) return p
  }
  return null
}

function sectionIndex(html, name) {
  const re = new RegExp(`<section[^>]*class=["'][^"']*\\b${name}\\b`, 'i')
  const m = html.match(re)
  return m ? html.indexOf(m[0]) : -1
}

function detect(html) {
  const has = (re) => re.test(html)
  const hasMarqueeStrip =
    has(/class=["'][^"']*\bmarquee\b[^"']*["']/i) || has(/id=["'][^"']*marquee/i)

  const eventsSplit =
    has(/c-acara-box/i) &&
    has(/btn-lokasi|Maps Lokasi Acara/i) &&
    (has(/height:\s*180px/i) || has(/border-radius:\s*20px\s+20px\s+0/i))

  const storyLux = has(/story-card-lux|story-overlay-luxury/i)
  const mapsEmbed = has(/c-embed-map-id|maps\/embed\?/i)

  const coupleIdx = sectionIndex(html, 'couple-section')
  const acaraIdx = sectionIndex(html, 'acara-section')
  const storyIdx = sectionIndex(html, 'story-section')
  const venueIdx = sectionIndex(html, 'venue-section')
  const thankIdx = sectionIndex(html, 'thank-section')
  const doaIdx = html.indexOf('id="c-doa-id"')
  const galIdx = Math.max(html.indexOf('id="c-galery-id"'), html.indexOf('galery_cli'))

  const verseInCouple =
    coupleIdx >= 0 && doaIdx > coupleIdx && (acaraIdx < 0 || doaIdx < acaraIdx)

  const coupleGranular =
    has(/mempe-gl1[^>]*data-aos=["']fade-left/i) ||
    has(/data-aos=["']fade-left["'][^>]*mempe-gl1/i) ||
    (has(/profil-aes/i) && has(/data-aos=["']zoom-in["']/i) && has(/data-aos=["']fade-right["']/i))

  const galleryAfterStory =
    storyIdx >= 0 && galIdx > storyIdx && (venueIdx < 0 || galIdx < venueIdx)

  const timelineConference = has(/id=["']conference-timeline["']|class=["'][^"']*timeline-article/i)
  const giftCards = has(/rek_each_soft_white|rek_each_world_brown|class=["']rek_each\b/i)

  let thankPhotoPill = false
  if (thankIdx >= 0) {
    const slice = html.slice(thankIdx, thankIdx + 4000)
    thankPhotoPill = /sampul_aes|profil-aes/.test(slice)
  }

  const galleryAlternate =
    has(/gallery-item[\s\S]{0,200}data-aos=["']?fade-(left|right)/i) ||
    has(/data-aos=["']?fade-(left|right)["']?[\s\S]{0,120}gallery-item/i)

  const showProtocolNote = has(/id=["']c-pengumuman-id["']|protokol pencegahan|COVID-19/i)
  const showLiveStreaming = has(/Video Live Streaming|Live Streaming Acara/i)

  return {
    showMarquee: hasMarqueeStrip,
    eventsVariant: eventsSplit ? 'split' : 'overlay',
    storyVariant: storyLux ? 'lux' : 'text',
    mapsEmbed,
    verseInCouple,
    coupleReveal: coupleGranular ? 'granular' : 'simple',
    galleryAfterStory,
    timelineVariant: timelineConference ? 'conference' : 'list',
    giftVariant: giftCards ? 'cards' : 'toggle',
    thankVariant: thankPhotoPill ? 'photo-pill' : 'text',
    galleryAnim: galleryAlternate ? 'alternate' : 'zoom',
    showProtocolNote,
    showLiveStreaming,
  }
}

const out = {}
const missing = []
for (const id of NATURE_IDS) {
  const page = findPage(id)
  if (!page) {
    missing.push(id)
    out[id] = null
    continue
  }
  const html = fs.readFileSync(page, 'utf8')
  out[id] = { scrape: path.relative(ROOT, page).replace(/\\/g, '/'), layout: detect(html) }
}

const dest = path.join(ROOT, 'reference', 'nature-layout-detect.json')
fs.writeFileSync(dest, JSON.stringify({ generatedAt: new Date().toISOString(), missing, themes: out }, null, 2))
console.log('Wrote', dest)
console.log('Missing:', missing.join(', ') || '(none)')
for (const id of NATURE_IDS) {
  const row = out[id]
  if (!row) continue
  const L = row.layout
  console.log(
    `${id.padEnd(20)} mq=${L.showMarquee} ev=${L.eventsVariant} st=${L.storyVariant} maps=${L.mapsEmbed} verse=${L.verseInCouple} couple=${L.coupleReveal} gal=${L.galleryAfterStory} time=${L.timelineVariant} gift=${L.giftVariant} thank=${L.thankVariant} gAnim=${L.galleryAnim} proto=${L.showProtocolNote} live=${L.showLiveStreaming}`,
  )
}
