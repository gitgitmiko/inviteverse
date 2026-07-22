import fs from 'node:fs'
import path from 'node:path'

const dir = 'reference/scrape-2026-07-22'
const file = process.argv[2] || 'classic-devotion-509.html'
const html = fs.readFileSync(path.join(dir, file), 'utf8')

// Extract style blocks mentioning cover/ornamen/border
const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1])
console.log('style blocks', styles.length)

const interesting = styles.join('\n').split(/}/).filter((chunk) =>
  /cover|ornamen|border|bawah|atas|frame|flower|snow|red-essence|classic|devotion|mempelai|couple|gallery/i.test(
    chunk,
  ),
)
console.log('interesting css chunks', interesting.length)
for (const c of interesting.slice(0, 40)) {
  console.log('---')
  console.log(c.trim().slice(0, 400) + '}')
}

// img src under template
const imgs = [...html.matchAll(/src=["']([^"']*nikah\/template\/[^"']+)["']/gi)].map(
  (m) => m[1],
)
console.log('\nimgs:', [...new Set(imgs)])

// data attributes / section wrappers
const sections = [...html.matchAll(/<(section|div)[^>]*(class|id)=["']([^"']+)["'][^>]*>/gi)]
  .map((m) => m[3])
  .filter((c) =>
    /cover|hero|couple|bride|groom|acara|event|story|gallery|rsvp|gift|timeline|penutup|ucapan|verse|salam/i.test(
      c,
    ),
  )
console.log('\nsection-like classes (sample):')
console.log([...new Set(sections)].slice(0, 60).join('\n'))
