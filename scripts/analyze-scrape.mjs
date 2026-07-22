import fs from 'node:fs'
import path from 'node:path'

const dir = 'reference/scrape-2026-07-22'
const files = [
  ['classic-devotion', 'classic-devotion-509.html'],
  ['red-essence', 'red-essence-508.html'],
  ['snow-blue', 'snow-blue-507.html'],
  ['snow-pink', 'snow-pink-506.html'],
]

function uniq(arr) {
  return [...new Set(arr)]
}

for (const [id, file] of files) {
  const html = fs.readFileSync(path.join(dir, file), 'utf8')
  console.log(`\n==== ${id} ====`)
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]
  console.log('title:', title)

  const fonts = uniq(
    [...html.matchAll(/fonts\.googleapis\.com\/css2\?family=([^"'&\s]+)/g)].map(
      (m) => decodeURIComponent(m[1]),
    ),
  )
  console.log('fonts:', fonts.join(' | ') || '(none in css2)')

  const fontFaces = uniq(
    [...html.matchAll(/family=([A-Za-z0-9+%:]+)/g)].map((m) =>
      decodeURIComponent(m[1].replace(/\+/g, ' ')).split(':')[0],
    ),
  ).slice(0, 12)
  console.log('font hints:', fontFaces.join(', '))

  const colorCounts = {}
  for (const m of html.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
    const c = ('#' + m[1]).toLowerCase()
    if (c === '#fff' || c === '#ffffff' || c === '#000' || c === '#000000') continue
    colorCounts[c] = (colorCounts[c] || 0) + 1
  }
  const topColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
  console.log(
    'top colors:',
    topColors.map(([c, n]) => `${c}x${n}`).join(', '),
  )

  const assets = uniq(
    [...html.matchAll(/nikah\/template\/[^"'\)\s]+/g)].map((m) => m[0]),
  )
  console.log(`assets (${assets.length}):`)
  for (const a of assets.slice(0, 30)) console.log(' ', a)

  const cssVars = uniq(
    [...html.matchAll(/--([a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g)].map(
      (m) => `${m[1]}=${m[2].trim()}`,
    ),
  ).slice(0, 20)
  console.log('css vars sample:', cssVars.join(' | '))

  console.log('aos=', /AOS\.init/.test(html), 'splide=', /splide/i.test(html))

  // background-image urls
  const bgs = uniq(
    [...html.matchAll(/background(?:-image)?\s*:\s*[^;]*url\((['"]?)([^)'"]+)\1\)/gi)].map(
      (m) => m[2],
    ),
  ).filter((u) => /template|ornamen|border|bawah|atas|bg|flower|snow|classic|red/i.test(u))
  console.log('bg urls (filtered):', bgs.length)
  for (const u of bgs.slice(0, 20)) console.log(' ', u)
}
