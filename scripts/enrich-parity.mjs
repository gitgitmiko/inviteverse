import fs from 'node:fs'
import path from 'node:path'

const deep = 'reference/scrape-2026-07-22-deep'
const themes = ['classic-devotion', 'red-essence', 'snow-blue', 'snow-pink']

const photoFramesDetailed = {
  heroPill: {
    description:
      'Header couple photo is a tall pill/capsule (not arch). Aspect via padding-top 133.33% (≈3:4).',
    wrapper:
      '.header-section ... .image-wrapper { position:relative; width:100%; padding-top:133.3333333333%; margin-bottom:3rem; }',
    element:
      '.image-element { height:100%; background-color:var(--color-secondary); border-radius:300px; padding:1rem; }',
    img: '.image-element img { width:100%; height:100%; object-fit:cover; border-radius:300px; }',
    clipPath: 'none — uses border-radius:300px (stadium/pill)',
    note: 'Frame ring = padding 1rem + secondary bg. Recreate with free frame; do not use Indoinvite frame PNGs.',
  },
  reminderCards: {
    element: 'border-radius:14px; overflow:hidden; object-fit:cover',
    overlayBottom: 'linear-gradient(to top, var(--color-secondary) 0%, transparent 100%)',
  },
  coupleSectionPhotos: {
    note: 'Couple rows use side floral orn-1..6; primary portrait frame for parity is the header pill.',
  },
}

const coverOpen = {
  trigger: '#btn-envelope click',
  steps: [
    'body overflow unlocked',
    '.cover-section.addClass(cover-opened)',
    'cover + overlay + ornaments-wrapper backgrounds set transparent',
    'runAnimationOrnament() + runAnimationLoop()',
    '.fix-menu shown',
    'music typically starts (separate handler)',
  ],
  css: {
    orn1: 'transform:translateX(-100%); transition:all 2s ease-in',
    orn2: 'transform:translateX(100%); transition:all 2s ease-in 400ms',
    orn3: 'transform:translateX(-100%); transition:all 2s ease-in 400ms',
    orn4: 'transform:translateX(100%); transition:all 2s ease-in',
    wrapper: 'transform:scale(1.5); opacity:0 (transition all 0.5s ease-in-out)',
    coverSection:
      'transition all 1s ease-out; cover-opened → pointer-events:none; z-index remains 9999 fixed',
  },
}

const coverOrnSlotsDetailed = [
  {
    id: 'orn-1',
    parent: 'cover-section',
    css: 'position:absolute; top:0; left:0; width:120%; transform:translate(-40%,-10%); ornaments-wrapper z-index:110',
    open: 'translateX(-100%) 2s ease-in',
  },
  {
    id: 'orn-2',
    parent: 'cover-section',
    css: 'position:absolute; top:0; right:0; width:130%; transform:translate(50%,-20%)',
    open: 'translateX(100%) 2s ease-in 400ms',
  },
  {
    id: 'orn-3',
    parent: 'cover-section',
    css: 'position:absolute; top:50%; left:0; width:120%; transform:translate(-50%,-8%)',
    open: 'translateX(-100%) 2s ease-in 400ms',
  },
  {
    id: 'orn-4',
    parent: 'cover-section',
    css: 'position:absolute; top:50%; right:0; width:120%; transform:translate(50%,-10%)',
    open: 'translateX(100%) 2s ease-in',
  },
]

for (const id of themes) {
  const f = path.join(deep, `${id}-parity.json`)
  const p = JSON.parse(fs.readFileSync(f, 'utf8'))
  p.photoFramesDetailed = photoFramesDetailed
  p.animations.coverOpen = { ...p.animations.coverOpen, ...coverOpen }
  p.cover.ornSlotsDetailed = coverOrnSlotsDetailed

  const htmlFile = fs.readdirSync(deep).find((n) => n.startsWith(`${id}-`) && n.endsWith('.html'))
  const html = fs.readFileSync(path.join(deep, htmlFile), 'utf8')
  const ornImgs = [
    ...html.matchAll(/nikah\/template\/(?:red|pink|fantasy|elegan)[^"'\s)]+\.(?:png|webp|svg|jpe?g)/gi),
  ].map((m) => m[0])
  p.skippedOrnamentImagePaths = [...new Set(ornImgs)]
  fs.writeFileSync(f, JSON.stringify(p, null, 2))
  console.log('enriched', id, 'skippedImgs', p.skippedOrnamentImagePaths.length)
}
