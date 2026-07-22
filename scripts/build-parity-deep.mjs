import fs from 'node:fs'
import path from 'node:path'

const deep = 'reference/scrape-2026-07-22-deep'
const themes = [
  { id: 'classic-devotion', num: 509, label: 'Classic-Devotion', accentExpected: '#A49178' },
  { id: 'red-essence', num: 508, label: 'Red-Essence', accentExpected: null },
  { id: 'snow-blue', num: 507, label: 'Snow-Blue', accentExpected: null },
  { id: 'snow-pink', num: 506, label: 'Snow-Pink', accentExpected: null },
]

function extractStyleBlocks(html) {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1])
}

function cssVars(styles) {
  const vars = {}
  for (const m of styles.join('\n').matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    vars[`--${m[1]}`] = m[2].trim()
  }
  return vars
}

function extractRule(css, selector) {
  // naive: find selector { ... } first occurrence (non-nested enough for our use)
  const re = new RegExp(
    selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}',
    'i',
  )
  const m = css.match(re)
  return m ? m[1].replace(/\s+/g, ' ').trim() : null
}

function extractOrnSlots(css, sectionPrefix) {
  const slots = []
  const re = new RegExp(
    `\\.${sectionPrefix}\\s+\\.orn-([0-9]+)\\s*\\{([^}]*)\\}`,
    'gi',
  )
  for (const m of css.matchAll(re)) {
    const body = m[2].replace(/\s+/g, ' ').trim()
    const img = extractRule(css, `.${sectionPrefix} .orn-${m[1]} .image-element`)
    // find background url in nearby or in image-element
    const urlMatch =
      body.match(/url\((['"]?)([^)'"]+)\1\)/i) ||
      (img && img.match(/url\((['"]?)([^)'"]+)\1\)/i))
    slots.push({
      selector: `.${sectionPrefix} .orn-${m[1]}`,
      ornId: `orn-${m[1]}`,
      parentSection: sectionPrefix,
      css: body,
      imageElementCss: img,
      ornamentImageUrl: urlMatch ? urlMatch[2] : null,
      skippedDownload: urlMatch
        ? /nikah\/template\//i.test(urlMatch[2]) || /\.(png|svg|webp|jpe?g)/i.test(urlMatch[2])
        : true,
    })
  }
  return slots
}

function extractAllOrnWithUrl(css) {
  const slots = []
  // Match .SECTION .orn-N { ... } and also nested
  const re = /\.([a-z0-9_-]+-section)(?:\s+\.[a-z0-9_.-]+)*\s+\.orn-([0-9]+)\s*\{([^}]*)\}/gi
  for (const m of css.matchAll(re)) {
    const section = m[1]
    const orn = m[2]
    const body = m[3].replace(/\s+/g, ' ').trim()
    const fullSel = m[0].slice(0, m[0].indexOf('{')).trim()
    // try find background-image for this orn in css with url in same block or child
    let url = null
    const urlInBody = body.match(/url\((['"]?)([^)'"]+)\1\)/i)
    if (urlInBody) url = urlInBody[2]
    // also search for .section ... orn-N ... background or content img src later
    slots.push({
      selector: fullSel,
      ornId: `orn-${orn}`,
      parentSection: section,
      css: body,
      position: {
        top: (body.match(/top:\s*([^;]+)/i) || [])[1] || null,
        left: (body.match(/left:\s*([^;]+)/i) || [])[1] || null,
        right: (body.match(/right:\s*([^;]+)/i) || [])[1] || null,
        bottom: (body.match(/bottom:\s*([^;]+)/i) || [])[1] || null,
        width: (body.match(/width:\s*([^;]+)/i) || [])[1] || null,
        transform: (body.match(/transform:\s*([^;]+)/i) || [])[1] || null,
        zIndex: (body.match(/z-index:\s*([^;]+)/i) || [])[1] || null,
      },
      ornamentImageUrl: url,
      skippedDownload: true,
    })
  }
  return slots
}

function extractBgUrlsForOrns(html, css) {
  // From HTML: cover ornaments img src near ornaments-wrapper
  const imgs = [...html.matchAll(/<(?:img|div)[^>]*(?:src|data-src|style)=["']([^"']+)["'][^>]*>/gi)]
    .map((m) => m[1])
    .filter((u) => /nikah\/template\//i.test(u) || /media\.indoinvite/i.test(u))
  // CSS background urls with template
  const cssUrls = [...css.matchAll(/url\((['"]?)([^)'"]+)\1\)/gi)].map((m) => m[2])
  const templateUrls = [...new Set([...imgs, ...cssUrls].filter((u) => /nikah\/template\//i.test(u)))]
  return templateUrls
}

function extractAos(html) {
  const attrs = [...html.matchAll(/data-aos(?:=["']([^"']+)["'])?/gi)].map((m) => m[1] || true)
  const delays = [...html.matchAll(/data-aos-delay=["']([^"']+)["']/gi)].map((m) => m[1])
  const durations = [...html.matchAll(/data-aos-duration=["']([^"']+)["']/gi)].map((m) => m[1])
  const unique = [...new Set(attrs.filter((a) => typeof a === 'string'))]
  const dataAnim = [...html.matchAll(/data-anim=["']([^"']+)["']/gi)].map((m) => m[1])
  const dataAnimDelay = [...html.matchAll(/data-anim-delay=["']([^"']+)["']/gi)].map((m) => m[1])
  return {
    aosInit: { duration: 3000 },
    aosTypes: unique,
    aosDelaySamples: [...new Set(delays)].slice(0, 20),
    aosDurationSamples: [...new Set(durations)].slice(0, 20),
    dataAnimTypes: [...new Set(dataAnim)],
    dataAnimDelaySamples: [...new Set(dataAnimDelay)].slice(0, 20),
  }
}

function extractFonts(html, css) {
  const families = [...css.matchAll(/font-family:\s*([^;]+);/gi)].map((m) => m[1].trim())
  const google = [...html.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/gi)].map((m) =>
    decodeURIComponent(m[1].replace(/\+/g, ' ')),
  )
  return {
    googleFontLinks: [...new Set(google)],
    stacksUsedInInlineCss: [...new Set(families)].slice(0, 40),
  }
}

function extractSectionsOrder(html) {
  const order = []
  const re = /<(?:section|div)[^>]*class=["']([^"']*(?:-section|cover|header|couple|acara|story|timeline|gallery|rsvp|gift|ucapan|penutup|thank)[^"']*)["']/gi
  for (const m of html.matchAll(re)) {
    const classes = m[1].split(/\s+/).filter((c) =>
      /section|cover|header|couple|acara|story|timeline|gallery|rsvp|gift|ucapan|penutup|thank|salam|intro/i.test(
        c,
      ),
    )
    for (const c of classes) {
      if (!order.includes(c)) order.push(c)
    }
  }
  return order
}

function extractSplide(html) {
  const configs = []
  for (const m of html.matchAll(/new\s+Splide\s*\(\s*['"]([^'"]+)['"]\s*,\s*(\{[\s\S]*?\})\s*\)/gi)) {
    configs.push({ selector: m[1], configRaw: m[2].replace(/\s+/g, ' ').trim().slice(0, 800) })
  }
  // also look for data-splide
  const dataSplide = [...html.matchAll(/data-splide=["']([^"']+)["']/gi)].map((m) => m[1])
  return { newSplideCalls: configs, dataSplideAttrs: dataSplide.slice(0, 10) }
}

function extractCoverOpenScript(html) {
  const snippets = []
  for (const m of html.matchAll(/cover-opened[\s\S]{0,200}/gi)) {
    snippets.push(m[0].replace(/\s+/g, ' ').trim().slice(0, 250))
  }
  const click = html.match(/ketika klik buka undangan[\s\S]{0,800}/i)
  return {
    clickHandlerSnippet: click ? click[0].replace(/\s+/g, ' ').trim().slice(0, 900) : null,
    coverOpenedMentions: [...new Set(snippets)].slice(0, 10),
  }
}

function extractPhotoFrameCss(css) {
  const selectors = [
    '.header-section .header-content .header .header-title-content .image-wrapper .image-element',
    '.header-section .header-content .header .header-title-content .image-wrapper .image-element img',
    '.couple-section .couple-content .image-wrapper',
    '.couple-section .couple-content .image-wrapper .image-element',
    '.couple-section .couple-content .image-wrapper .image-element img',
    '.couple-section .image-wrapper .image-element',
    '.couple-section .image-wrapper .image-element img',
    '.reminder-wrap .image-wrapper .image-element',
    '.reminder-wrap .image-wrapper .image-element img',
    '.story-section .image-wrapper .image-element',
  ]
  const frames = {}
  for (const sel of selectors) {
    const rule = extractRule(css, sel)
    if (rule) frames[sel] = rule
  }
  // also gather clip-path / border-radius related rules mentioning image-element in couple/header
  const clipRules = []
  for (const m of css.matchAll(/([^{}/]*image-element[^{]*)\{([^}]*clip-path[^}]*)\}/gi)) {
    clipRules.push({ selector: m[1].trim(), css: m[2].replace(/\s+/g, ' ').trim() })
  }
  for (const m of css.matchAll(/([^{}/]*(?:couple|header)[^{]*img[^{]*)\{([^}]*(?:border-radius|object-fit|clip-path)[^}]*)\}/gi)) {
    clipRules.push({ selector: m[1].trim(), css: m[2].replace(/\s+/g, ' ').trim() })
  }
  return { frames, clipAndRadiusRules: clipRules.slice(0, 30) }
}

function extractTypographyRoles(css, html) {
  const roles = {}
  const map = [
    ['coverGuestName', '#kpd'],
    ['coverKepada', '.kepada'],
    ['coverSubtitle', '.sampul_sub_title'],
    ['coverEventName', '#sampul-nama-acara'],
    ['coverNames', '#aca-fun-h1-id1'],
    ['heading', 'h1, h2'],
    ['coupleAnd', '.couple-section .and span'],
  ]
  for (const [role, sel] of map) {
    const r = extractRule(css, sel)
    if (r) roles[role] = { selector: sel, css: r }
  }
  // font sizes from common id classes
  const sizeHits = [...css.matchAll(/(#[a-z0-9_-]+|\.[a-z0-9_-]+)\s*\{[^}]*font-size:\s*([^;]+);/gi)].map(
    (m) => ({ selector: m[1], fontSize: m[2].trim() }),
  )
  roles.fontSizeSamples = sizeHits.filter((h) =>
    /sampul|kpd|nama|couple|countdown|title|heading|mempelai/i.test(h.selector),
  ).slice(0, 40)
  return roles
}

function extractCountdown(html, css) {
  const simply = html.match(/simplyCountdown\([^)]*\)[\s\S]{0,400}/)
  const wrap = extractRule(css, '.simply-countdown') || extractRule(css, '.countdown')
  const digits = [...css.matchAll(/([^{}]*(?:countdown|simply)[^{]*)\{([^}]*)\}/gi)]
    .slice(0, 15)
    .map((m) => ({ selector: m[1].trim(), css: m[2].replace(/\s+/g, ' ').trim() }))
  return {
    simplyCountdownSnippet: simply ? simply[0].replace(/\s+/g, ' ').trim().slice(0, 500) : null,
    wrapperCss: wrap,
    relatedRules: digits,
  }
}

function compareThemes(parities) {
  const keys = ['--color-heading', '--color-secondary', '--color-paragraph', '--color-primary', '--color-other']
  const diff = { cssVars: {}, fonts: {}, ornamentUrlCounts: {} }
  for (const p of parities) {
    diff.cssVars[p.id] = Object.fromEntries(keys.map((k) => [k, p.colors[k] || null]))
    diff.fonts[p.id] = p.typography.stacksUsedInInlineCss?.slice(0, 8)
    diff.ornamentUrlCounts[p.id] = p.skippedOrnamentUrls.length
  }
  return {
    note: 'Keempat tema memakai shell elegan-nature yang sama; perbedaan utama di CSS variables (accent) dan aset ornamen/sampul.',
    ...diff,
  }
}

const parities = []

for (const t of themes) {
  const file = path.join(deep, `${t.id}-${t.num}.html`)
  const html = fs.readFileSync(file, 'utf8')
  const styles = extractStyleBlocks(html)
  const css = styles.join('\n')
  fs.writeFileSync(path.join(deep, `inline-all-${t.id}.css`), css)

  const vars = cssVars(styles)
  const coverOrns = extractOrnSlots(css, 'cover-section')
  const allOrns = extractAllOrnWithUrl(css)
  const skippedUrls = extractBgUrlsForOrns(html, css)
  const coverCss = {
    coverSection: extractRule(css, '.cover-section'),
    coverOpened: extractRule(css, '.cover-section.cover-opened'),
    coverWrapper: extractRule(css, '.cover-section .cover-wrapper'),
    coverOpenedWrapper: extractRule(css, '.cover-section.cover-opened .cover-wrapper'),
    coverBody: extractRule(css, '.cover-section .cover-wrapper .cover-content .cover-body'),
    btn: extractRule(css, '.cover-section .btn-elegan-nature'),
    ornamentsWrapper: extractRule(css, '.ornaments-wrapper'),
    ornOpened: {
      orn1: extractRule(css, '.cover-section.cover-opened .orn-1 .image-element'),
      orn2: extractRule(css, '.cover-section.cover-opened .orn-2 .image-element'),
      orn3: extractRule(css, '.cover-section.cover-opened .orn-3 .image-element'),
      orn4: extractRule(css, '.cover-section.cover-opened .orn-4 .image-element'),
    },
    ornSlots: coverOrns,
  }

  // Map ornament img URLs from HTML near cover
  const coverHtmlIdx = html.indexOf('cover-section')
  const coverHtml = coverHtmlIdx >= 0 ? html.slice(coverHtmlIdx, coverHtmlIdx + 25000) : ''
  const coverImgUrls = [...coverHtml.matchAll(/(?:src|data-src)=["']([^"']+)["']/gi)].map((m) => m[1])
  for (let i = 0; i < coverOrns.length; i++) {
    if (!coverOrns[i].ornamentImageUrl && coverImgUrls[i]) {
      coverOrns[i].ornamentImageUrl = coverImgUrls[i]
      coverOrns[i].skippedDownload = /nikah\/template\//i.test(coverImgUrls[i])
    }
  }

  const parity = {
    id: t.id,
    label: t.label,
    source: `https://indoinvite.com/s/1952/undangan/${t.num}?kpd=Bapak%20Budi&contoh=1`,
    scrapedAt: '2026-07-22',
    sharedLayoutEngine: 'elegan-nature',
    note: 'Referensi parity visual. Ornamen Indoinvite (nikah/template/) TIDAK diunduh — hanya URL + CSS slot.',
    colors: vars,
    typography: extractFonts(html, css),
    typographyRoles: extractTypographyRoles(css, html),
    cover: coverCss,
    photoFrames: extractPhotoFrameCss(css),
    ornamentSlots: allOrns,
    skippedOrnamentUrls: skippedUrls,
    animations: {
      ...extractAos(html),
      coverOpen: {
        description:
          'Klik CTA menambah class cover-opened. Ornamen orn-1/3 slide translateX(-100%), orn-2/4 translateX(100%) dengan transition 2s ease-in (stagger 400ms pada orn-2/3). cover-wrapper scale(1.5)+opacity:0 (0.5s). Cover pointer-events:none. Section cover tetap fixed z-index 9999.',
        timings: {
          coverSectionTransition: 'all 1s ease-out',
          ornSlide: 'all 2s ease-in',
          orn2Delay: '400ms',
          orn3Delay: '400ms',
          wrapper: 'all 0.5s ease-in-out → scale(1.5) opacity 0',
        },
        script: extractCoverOpenScript(html),
      },
      gsap: {
        plugins: ['ScrollTrigger', 'Flip'],
        source: 'nikah/js/animations.js + elegan-nature/css/animations.css',
        dataAnimDriven: true,
      },
    },
    sectionsOrder: extractSectionsOrder(html),
    gallery: extractSplide(html),
    countdown: extractCountdown(html, css),
    cssFilesLinked: [...html.matchAll(/<link[^>]+href=["']([^"']+\.css[^"']*)["']/gi)].map((m) => m[1]),
    jsFilesLinked: [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]),
  }

  fs.writeFileSync(path.join(deep, `${t.id}-parity.json`), JSON.stringify(parity, null, 2))
  parities.push(parity)
  console.log(
    t.id,
    'vars',
    vars['--color-heading'],
    'coverOrns',
    coverOrns.length,
    'allOrns',
    allOrns.length,
    'skipUrls',
    skippedUrls.length,
  )
}

const diff = compareThemes(parities)
fs.writeFileSync(path.join(deep, 'themes-diff.json'), JSON.stringify(diff, null, 2))
console.log('diff written', JSON.stringify(diff.cssVars, null, 2))
