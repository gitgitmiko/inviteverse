import fs from 'node:fs'
import path from 'node:path'

const dir = 'reference/scrape-2026-07-22'

const themes = [
  {
    id: 'classic-devotion',
    label: 'Classic-Devotion',
    source: 'https://indoinvite.com/s/1952/undangan/509?kpd=Bapak%20Budi&contoh=1',
    file: 'classic-devotion-509.html',
    palette: {
      accent: '#a49178',
      secondary: '#a49178',
      ink: '#212121',
      bg: '#ffffff',
      card: '#ececec',
      muted: '#6b635a',
    },
    fonts: {
      display: 'Waterfall',
      script: 'Dancing Script',
      body: 'Nunito Sans',
    },
    indoinviteAssetsSkipped: [
      'nikah/template/red/red-essence/2.png (shared flower asset — NOT used)',
    ],
  },
  {
    id: 'red-essence',
    label: 'Red-Essence',
    source: 'https://indoinvite.com/s/1952/undangan/508?kpd=Bapak%20Budi&contoh=1',
    file: 'red-essence-508.html',
    palette: {
      accent: '#621b26',
      secondary: '#621b26',
      ink: '#212121',
      bg: '#ffffff',
      card: '#ececec',
      muted: '#8a4a55',
    },
    fonts: {
      display: 'Waterfall',
      script: 'Alice',
      body: 'Nunito Sans',
    },
    indoinviteAssetsSkipped: [
      'nikah/template/red/red-essence/1.png',
      'nikah/template/red/red-essence/2.png',
    ],
  },
  {
    id: 'snow-blue',
    label: 'Snow-Blue',
    source: 'https://indoinvite.com/s/1952/undangan/507?kpd=Bapak%20Budi&contoh=1',
    file: 'snow-blue-507.html',
    palette: {
      accent: '#2c7fb5',
      secondary: '#2c7fb5',
      ink: '#212121',
      bg: '#ffffff',
      card: '#ececec',
      muted: '#5a8fb8',
    },
    fonts: {
      display: 'Waterfall',
      script: 'Dancing Script',
      body: 'Nunito Sans',
    },
    indoinviteAssetsSkipped: [
      'nikah/template/pink/snow-pink/cover.webp',
      'nikah/template/pink/snow-pink/cov.webp',
      'nikah/template/pink/snow-pink/2.webp',
      'nikah/template/pink/snow-pink/6.webp',
      'nikah/template/pink/snow-pink/*.ttf|otf (use Google Fonts instead)',
    ],
  },
  {
    id: 'snow-pink',
    label: 'Snow-Pink',
    source: 'https://indoinvite.com/s/1952/undangan/506?kpd=Bapak%20Budi&contoh=1',
    file: 'snow-pink-506.html',
    palette: {
      accent: '#f393b0',
      secondary: '#f393b0',
      ink: '#212121',
      bg: '#ffffff',
      card: '#ececec',
      muted: '#c97a94',
    },
    fonts: {
      display: 'Waterfall',
      script: 'Dancing Script',
      body: 'Nunito Sans',
    },
    indoinviteAssetsSkipped: [
      'nikah/template/pink/snow-pink/1.webp … 5.webp',
      'nikah/template/pink/snow-pink/bc.webp',
      'nikah/template/pink/snow-pink/cover assets',
    ],
  },
]

const sharedLayout = {
  engine: 'elegan-nature (shared Indoinvite shell)',
  cover: {
    description:
      'Fixed full-viewport cover, photo bg, CTA button; 4 side ornaments (orn-1..4) slide out on open',
    ornamentSlots: [
      { id: 'cover-orn-1', position: 'top-left', css: 'top:0;left:0;width:120%;translate(-40%,-10%)' },
      { id: 'cover-orn-2', position: 'top-right', css: 'top:0;right:0;width:130%;translate(50%,-20%)' },
      { id: 'cover-orn-3', position: 'mid-left', css: 'top:50%;left:0;width:120%;translate(-50%,-8%)' },
      { id: 'cover-orn-4', position: 'mid-right', css: 'top:50%;right:0;width:120%;translate(50%,-10%)' },
    ],
    cta: 'Buka Undangan',
  },
  afterOpen: {
    header: 'Hero + names + countdown; many corner ornaments (orn-1..15) + optional birds',
    couple: 'Groom/bride rows with side floral ornaments (orn-1..6)',
    venue: 'Events / reminder cards',
    story: 'Love story cards',
    rsvp: 'RSVP with corner ornaments',
    gift: 'Titip hadiah',
    gallery: 'Photo gallery',
    thank: 'Closing thanks with ornaments',
  },
  animations: ['AOS', 'Splide fade', 'GSAP cover open transition'],
  freeOrnamentStrategy:
    'Do NOT use Indoinvite template assets. Map free PD/CC0 florals to cover orn-1..4 + section corners.',
}

const out = []
for (const t of themes) {
  const html = fs.readFileSync(path.join(dir, t.file), 'utf8')
  const structure = {
    id: t.id,
    label: t.label,
    source: t.source,
    scrapedAt: '2026-07-22',
    note: 'Struktur saja. Ornamen Indoinvite di-skip; diganti aset gratis.',
    sharedLayout,
    visual: {
      palette: t.palette,
      fonts: t.fonts,
      cssVarsFromPage: {
        'color-heading': t.palette.accent,
        'color-secondary': t.palette.secondary,
        'color-paragraph': t.palette.ink,
        'color-primary': '#FFFFFF',
      },
      ornamentSlotsForAdmin: [
        'cover-orn-1 (top-left)',
        'cover-orn-2 (top-right)',
        'cover-orn-3 (mid-left)',
        'cover-orn-4 (mid-right)',
        'header-corners',
        'couple-side-florals',
        'section-top / section-bottom sprays',
        'rsvp / thank corners',
      ],
      indoinviteAssetsSkipped: t.indoinviteAssetsSkipped,
    },
    sections: [
      'cover',
      'header-hero',
      'intro',
      'couple',
      'venue-events',
      'story',
      'timeline',
      'gift',
      'rsvp',
      'gallery',
      'thank-footer',
    ],
    htmlBytes: html.length,
  }
  const dest = path.join(dir, `${t.id}-structure.json`)
  fs.writeFileSync(dest, JSON.stringify(structure, null, 2) + '\n')
  out.push(dest)
  console.log('wrote', dest)
}

fs.writeFileSync(
  path.join(dir, 'README.md'),
  `# Scrape 2026-07-22 — 4 tema uji

Sumber katalog: https://indoinvite.com/hasil/1952?contoh=1

| ID | Label | URL contoh |
|----|-------|------------|
| classic-devotion | Classic-Devotion | /undangan/509 |
| red-essence | Red-Essence | /undangan/508 |
| snow-blue | Snow-Blue | /undangan/507 |
| snow-pink | Snow-Pink | /undangan/506 |

Ketiganya (+ Classic) memakai shell **elegan-nature** dengan CSS variable warna berbeda.

**Ornamen asli Indoinvite tidak dipakai.** Lihat \`SOURCES.md\` di \`src/assets/ornaments/free/batch-2/\`.
`,
)
console.log('done', out.length)
