import fs from 'node:fs'
import path from 'node:path'

const dir = 'reference/scrape-2026-07-22'
const files = [
  'classic-devotion-509',
  'red-essence-508',
  'snow-blue-507',
  'snow-pink-506',
]

for (const f of files) {
  const html = fs.readFileSync(path.join(dir, `${f}.html`), 'utf8')
  console.log(`\n== ${f} ==`)
  const idx = html.indexOf('ornaments-wrapper')
  if (idx >= 0) {
    const snip = html.slice(idx, idx + 8000)
    const srcs = [...snip.matchAll(/(?:src|data-src|data-lazy)=["']([^"']+)["']/g)].map(
      (m) => m[1],
    )
    console.log('near ornaments-wrapper:')
    for (const s of [...new Set(srcs)].slice(0, 20)) console.log(' ', s)
  }

  // CSS url near orn-
  const cssOrn = [
    ...html.matchAll(/\.orn-([1-8])[^{]*\{[^}]*url\((['"]?)([^)'"]+)\2\)/gi),
  ]
  console.log('css orn urls', cssOrn.length)
  for (const m of cssOrn.slice(0, 10)) console.log(' ', m[1], m[3])

  // All image urls containing template theme folder keywords
  const keys = ['classic', 'devotion', 'red-essence', 'snow-pink', 'snow-blue', 'elegan-nature']
  const all = [...html.matchAll(/(https?:\/\/[^"'()\s]+|\/nikah\/template\/[^"'()\s]+)/g)].map(
    (m) => m[1],
  )
  const filtered = [...new Set(all)].filter((u) =>
    keys.some((k) => u.toLowerCase().includes(k)),
  )
  console.log('theme asset urls:')
  for (const u of filtered.slice(0, 40)) console.log(' ', u)
}
