import type {
  CoverVisual,
  FreeOrnament,
  OrnamentAnim,
  SectionId,
  SectionVisual,
  SlotBackground,
  SlotTransform,
  ThemeColors,
  ThemeId,
  ThemeVisualStyle,
} from './themeTypes'
import { ORNAMENT_ASSETS as O } from './ornamentAssets'

export type {
  CoverVisual,
  FreeOrnament,
  OrnamentAnim,
  SectionFrames,
  SectionId,
  SectionVisual,
  SlotBackground,
  SlotTransform,
  ThemeColors,
  ThemeId,
  ThemeVisualStyle,
} from './themeTypes'

const SECTION_IDS: SectionId[] = [
  'hero',
  'intro',
  'couple',
  'events',
  'story',
  'timeline',
  'gift',
  'rsvp',
  'gallery',
  'footer',
]

function emptyBg(color = ''): SlotBackground {
  return { mode: 'color', color, image: '' }
}

export function emptyTransform(): SlotTransform {
  return { offsetX: 0, offsetY: 0, scale: 1, rotate: 0 }
}

export function createOrnament(
  src = '',
  partial?: Partial<FreeOrnament>,
): FreeOrnament {
  return {
    id:
      partial?.id ??
      `orn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    src,
    anim: partial?.anim ?? 'none',
    transform: { ...emptyTransform(), ...(partial?.transform ?? {}) },
    flipX: partial?.flipX ?? false,
    flipY: partial?.flipY ?? false,
  }
}

/** Duplikat ornamen (setting sama, id baru) */
export function duplicateOrnament(source: FreeOrnament): FreeOrnament {
  return createOrnament(source.src, {
    anim: source.anim,
    transform: { ...emptyTransform(), ...source.transform },
    flipX: source.flipX ?? false,
    flipY: source.flipY ?? false,
  })
}

/** Migrasi slot atas/bawah lama → array ornamen bebas */
function migrateLegacyOrnamentSlots(raw: Record<string, unknown> | undefined): FreeOrnament[] {
  if (!raw) return []
  if (Array.isArray(raw.ornaments)) {
    return (raw.ornaments as FreeOrnament[]).map((o) =>
      createOrnament(o.src ?? '', {
        id: o.id,
        anim: (o.anim as OrnamentAnim) ?? 'none',
        transform: { ...emptyTransform(), ...(o.transform ?? {}) },
        flipX: o.flipX ?? false,
        flipY: o.flipY ?? false,
      }),
    )
  }

  const list: FreeOrnament[] = []
  const top = typeof raw.ornamentTop === 'string' ? raw.ornamentTop : ''
  const bottom =
    typeof raw.ornamentBottom === 'string' ? raw.ornamentBottom : ''

  if (top) {
    list.push(
      createOrnament(top, {
        id: 'migrated-top',
        anim: (raw.ornamentTopAnim as OrnamentAnim) ?? 'none',
        transform: {
          ...emptyTransform(),
          ...((raw.ornamentTopTransform as SlotTransform) ?? {}),
          offsetY:
            (raw.ornamentTopTransform as SlotTransform | undefined)?.offsetY ??
            -38,
        },
      }),
    )
  }
  if (bottom) {
    list.push(
      createOrnament(bottom, {
        id: 'migrated-bottom',
        anim: (raw.ornamentBottomAnim as OrnamentAnim) ?? 'none',
        transform: {
          ...emptyTransform(),
          ...((raw.ornamentBottomTransform as SlotTransform) ?? {}),
          offsetY:
            (raw.ornamentBottomTransform as SlotTransform | undefined)
              ?.offsetY ?? 38,
        },
      }),
    )
  }
  return list
}

function emptySection(): SectionVisual {
  return {
    ornaments: [],
    background: emptyBg(),
    textColor: '',
    frames: { cover: '', groom: '', bride: '' },
    framesTransform: {
      cover: emptyTransform(),
      groom: emptyTransform(),
      bride: emptyTransform(),
    },
  }
}

function emptyCover(bgColor: string): CoverVisual {
  return {
    ornaments: [],
    photoFrame: '',
    photoFrameTransform: emptyTransform(),
    background: emptyBg(bgColor),
    textColors: {
      eyebrow: '',
      name: '',
      guest: '',
      buttonBg: '',
      buttonText: '',
    },
    corners: {
      topLeft: '',
      topRight: '',
      bottomLeft: '',
      bottomRight: '',
    },
  }
}

function emptySections(): Record<SectionId, SectionVisual> {
  return Object.fromEntries(
    SECTION_IDS.map((id) => [id, emptySection()]),
  ) as Record<SectionId, SectionVisual>
}

function makeTheme(
  colors: ThemeColors,
  extras?: Partial<Pick<ThemeVisualStyle, 'showPetals' | 'ornamentMode'>>,
): ThemeVisualStyle {
  return {
    colors,
    showPetals: extras?.showPetals ?? false,
    ornamentMode: extras?.ornamentMode ?? 'svg',
    cover: emptyCover(colors.bg),
    sections: emptySections(),
  }
}

function buildSuperClassic(): ThemeVisualStyle {
  const t = makeTheme(
    {
      accent: '#7a2f3d',
      gold: '#a67c52',
      ink: '#2c241c',
      muted: '#6b5e52',
      bg: '#f7f1e8',
      card: '#fffdf9',
    },
    { showPetals: true, ornamentMode: 'image' },
  )
  t.cover.corners = {
    topLeft: O.scCorner,
    topRight: O.scCorner,
    bottomLeft: O.scCorner,
    bottomRight: O.scCorner,
  }
  t.cover.photoFrame = O.scFrame
  t.cover.photoFrameTransform = {
    ...emptyTransform(),
    scale: 1.08,
  }
  t.cover.ornaments = [
    createOrnament(O.scCornerWarm, {
      id: 'sc-cover-accent',
      anim: 'float',
      transform: { offsetX: 0, offsetY: 40, scale: 0.42, rotate: 0 },
    }),
  ]
  t.sections.intro.ornaments = [
    createOrnament(O.scCornerWarm, {
      id: 'sc-intro-tl',
      anim: 'float',
      transform: { offsetX: -42, offsetY: -36, scale: 0.5, rotate: 0 },
    }),
    createOrnament(O.scCornerWarm, {
      id: 'sc-intro-tr',
      anim: 'float',
      flipX: true,
      transform: { offsetX: 42, offsetY: -36, scale: 0.5, rotate: 0 },
    }),
  ]
  t.sections.footer.ornaments = [
    createOrnament(O.scCorner, {
      id: 'sc-footer-bl',
      transform: { offsetX: -40, offsetY: 34, scale: 0.5, rotate: 180 },
    }),
    createOrnament(O.scCorner, {
      id: 'sc-footer-br',
      flipX: true,
      transform: { offsetX: 40, offsetY: 34, scale: 0.5, rotate: 180 },
    }),
  ]
  return t
}

function buildEleganGrey(): ThemeVisualStyle {
  const t = makeTheme({
    accent: '#928573',
    gold: '#9e9180',
    ink: '#2d2d2d',
    muted: '#6a5d4c',
    bg: '#ececec',
    card: '#ffffff',
  })
  t.cover.ornaments = [
    createOrnament(O.egFlourish, {
      id: 'eg-cover-top',
      transform: { offsetX: 0, offsetY: -40, scale: 0.55, rotate: 0 },
    }),
    createOrnament(O.egFramePng, {
      id: 'eg-cover-bottom',
      transform: { offsetX: 0, offsetY: 38, scale: 0.65, rotate: 0 },
    }),
  ]
  t.cover.photoFrame = O.egFrame
  t.cover.photoFrameTransform = {
    ...emptyTransform(),
    scale: 1.05,
  }
  t.sections.couple.frames = {
    cover: '',
    groom: O.egFrame,
    bride: O.egFrame,
  }
  t.sections.couple.framesTransform = {
    cover: emptyTransform(),
    groom: { ...emptyTransform(), scale: 1.08 },
    bride: { ...emptyTransform(), scale: 1.08 },
  }
  t.sections.intro.ornaments = [
    createOrnament(O.egFlourish, {
      id: 'eg-intro-div',
      transform: { offsetX: 0, offsetY: -40, scale: 0.7, rotate: 0 },
    }),
  ]
  t.sections.footer.ornaments = [
    createOrnament(O.egFlourish, {
      id: 'eg-footer-div',
      transform: { offsetX: 0, offsetY: 36, scale: 0.75, rotate: 0 },
    }),
  ]
  return t
}

function buildBlueFlowers(): ThemeVisualStyle {
  const t = makeTheme({
    accent: '#005189',
    gold: '#359bb7',
    ink: '#1e1e1e',
    muted: '#2276b1',
    bg: '#ffffff',
    card: '#ffffff',
  })
  t.cover.ornaments = [
    createOrnament(O.bfCorner, {
      id: 'bf-cover-top',
      anim: 'float',
      transform: { offsetX: -28, offsetY: -40, scale: 0.55, rotate: 0 },
    }),
    createOrnament(O.bfCorner, {
      id: 'bf-cover-top-r',
      anim: 'float',
      flipX: true,
      transform: { offsetX: 28, offsetY: -40, scale: 0.55, rotate: 0 },
    }),
    createOrnament(O.bfCorner, {
      id: 'bf-cover-bottom',
      anim: 'float',
      transform: { offsetX: 0, offsetY: 40, scale: 0.7, rotate: 180 },
    }),
  ]
  t.cover.photoFrame = O.bfRing
  t.cover.photoFrameTransform = {
    ...emptyTransform(),
    scale: 1.2,
  }
  t.sections.hero.ornaments = [
    createOrnament(O.bfCorner, {
      id: 'bf-hero-bl',
      transform: { offsetX: -30, offsetY: 38, scale: 0.55, rotate: 180 },
    }),
    createOrnament(O.bfCorner, {
      id: 'bf-hero-br',
      flipX: true,
      transform: { offsetX: 30, offsetY: 38, scale: 0.55, rotate: 180 },
    }),
  ]
  t.sections.couple.frames = {
    cover: '',
    groom: O.bfRing,
    bride: O.bfRing,
  }
  t.sections.couple.framesTransform = {
    cover: emptyTransform(),
    groom: { ...emptyTransform(), scale: 1.15 },
    bride: { ...emptyTransform(), scale: 1.15 },
  }
  t.sections.events.frames = {
    cover: '',
    groom: '',
    bride: '',
  }
  t.sections.events.framesTransform = {
    cover: emptyTransform(),
    groom: emptyTransform(),
    bride: emptyTransform(),
  }
  t.sections.events.ornaments = [
    createOrnament(O.bfDivider, {
      id: 'bf-events-div',
      transform: { offsetX: 0, offsetY: -36, scale: 0.55, rotate: 0 },
    }),
  ]
  t.sections.footer.ornaments = [
    createOrnament(O.bfCorner, {
      id: 'bf-footer-bottom',
      transform: { offsetX: 0, offsetY: 36, scale: 0.6, rotate: 180 },
    }),
  ]
  return t
}

/** Shell elegan-nature (4 tema uji) — ornamen gratis di slot cover orn-1..4 */
function buildNatureFamily(
  colors: ThemeColors,
  corner: string,
  accentCorner?: string,
): ThemeVisualStyle {
  const t = makeTheme(colors)
  const side = accentCorner ?? corner
  t.cover.ornaments = [
    createOrnament(corner, {
      id: 'nf-cover-orn-1',
      anim: 'float',
      transform: { offsetX: -38, offsetY: -36, scale: 0.7, rotate: 0 },
    }),
    createOrnament(corner, {
      id: 'nf-cover-orn-2',
      anim: 'float',
      flipX: true,
      transform: { offsetX: 38, offsetY: -40, scale: 0.75, rotate: 0 },
    }),
    createOrnament(side, {
      id: 'nf-cover-orn-3',
      transform: { offsetX: -42, offsetY: 8, scale: 0.65, rotate: 0 },
    }),
    createOrnament(side, {
      id: 'nf-cover-orn-4',
      flipX: true,
      transform: { offsetX: 42, offsetY: 6, scale: 0.65, rotate: 0 },
    }),
  ]
  t.cover.photoFrame = O.batchFrame
  t.cover.photoFrameTransform = { ...emptyTransform(), scale: 1.05 }
  t.sections.hero.ornaments = [
    createOrnament(corner, {
      id: 'nf-hero-tl',
      transform: { offsetX: -36, offsetY: -38, scale: 0.45, rotate: 0 },
    }),
    createOrnament(corner, {
      id: 'nf-hero-tr',
      flipX: true,
      transform: { offsetX: 36, offsetY: -38, scale: 0.45, rotate: 0 },
    }),
  ]
  t.sections.couple.frames = {
    cover: '',
    groom: O.egFrame,
    bride: O.egFrame,
  }
  t.sections.couple.framesTransform = {
    cover: emptyTransform(),
    groom: { ...emptyTransform(), scale: 1.06 },
    bride: { ...emptyTransform(), scale: 1.06 },
  }
  t.sections.couple.textColor = colors.ink
  t.sections.couple.ornaments = [
    createOrnament(side, {
      id: 'nf-couple-l',
      transform: { offsetX: -40, offsetY: 0, scale: 0.5, rotate: 0 },
    }),
    createOrnament(side, {
      id: 'nf-couple-r',
      flipX: true,
      transform: { offsetX: 40, offsetY: 0, scale: 0.5, rotate: 0 },
    }),
  ]
  t.sections.intro.ornaments = [
    createOrnament(O.batchFlourish, {
      id: 'nf-intro-div',
      transform: { offsetX: 0, offsetY: -38, scale: 0.5, rotate: 0 },
    }),
  ]
  t.sections.rsvp.ornaments = [
    createOrnament(corner, {
      id: 'nf-rsvp-tl',
      transform: { offsetX: -38, offsetY: -36, scale: 0.4, rotate: 0 },
    }),
    createOrnament(corner, {
      id: 'nf-rsvp-tr',
      flipX: true,
      transform: { offsetX: 38, offsetY: -36, scale: 0.4, rotate: 0 },
    }),
  ]
  t.sections.footer.ornaments = [
    createOrnament(corner, {
      id: 'nf-footer-bl',
      transform: { offsetX: -36, offsetY: 36, scale: 0.45, rotate: 180 },
    }),
    createOrnament(corner, {
      id: 'nf-footer-br',
      flipX: true,
      transform: { offsetX: 36, offsetY: 36, scale: 0.45, rotate: 180 },
    }),
  ]
  return t
}

export const DEFAULT_THEME_STYLES: Record<ThemeId, ThemeVisualStyle> = {
  'super-classic': buildSuperClassic(),
  'elegan-grey': buildEleganGrey(),
  'blue-flowers': buildBlueFlowers(),
  'classic-devotion': (() => {
    const t = buildNatureFamily(
      {
        accent: '#A49178',
        gold: '#A49178',
        ink: '#212121',
        muted: '#6b635a',
        bg: '#ffffff',
        card: '#ececec',
      },
      '',
    )
    // Tanpa ornamen — scrape cover hanya overlay + tipografi
    t.cover.ornaments = []
    t.cover.photoFrame = ''
    for (const id of SECTION_IDS) {
      t.sections[id].ornaments = []
    }
    return t
  })(),
  'red-essence': buildNatureFamily(
    {
      accent: '#621B26',
      gold: '#8a4a55',
      ink: '#212121',
      muted: '#8a4a55',
      bg: '#ffffff',
      card: '#ececec',
    },
    O.reCorner,
  ),
  'snow-blue': buildNatureFamily(
    {
      accent: '#2c7fb5',
      gold: '#5a8fb8',
      ink: '#212121',
      muted: '#5a8fb8',
      bg: '#ffffff',
      card: '#ececec',
    },
    O.sbCorner,
  ),
  'snow-pink': buildNatureFamily(
    {
      accent: '#F393B0',
      gold: '#c97a94',
      ink: '#212121',
      muted: '#c97a94',
      bg: '#ffffff',
      card: '#ececec',
    },
    O.spCorner,
  ),
  'burgundy-pure': buildNatureFamily(
    {
      accent: '#671C2E',
      gold: '#C7AA73',
      ink: '#212121',
      muted: '#C7AA73',
      bg: '#ffffff',
      card: '#ececec',
    },
    O.reCorner,
    O.cdLeaf,
  ),
  'bear-brown': buildNatureFamily(
    {
      accent: '#835229',
      gold: '#A5744B',
      ink: '#212121',
      muted: '#A5744B',
      bg: '#ffffff',
      card: '#ececec',
    },
    O.cdLeaf,
  ),
  'infinite-gallop': buildNatureFamily(
    {
      accent: '#A30000',
      gold: '#E1BD68',
      ink: '#000000',
      muted: '#E1BD68',
      bg: '#ffffff',
      card: '#ececec',
    },
    O.reCorner,
    O.egFlourish,
  ),
  'sun-moon': buildNatureFamily(
    {
      accent: '#ee9f0a',
      gold: '#ee9f0a',
      ink: '#F9E8D1',
      muted: '#ee9f0a',
      bg: '#1a1208',
      card: '#2a1c0c',
    },
    O.sbCrystal,
    O.batchFlourish,
  ),
  'royal-mega': buildNatureFamily(
    {
      accent: '#fdc803',
      gold: '#fdc803',
      ink: '#333333',
      muted: '#fdc803',
      bg: '#ffffff',
      card: '#ececec',
    },
    O.egFlourish,
    O.batchFlourish,
  ),
  'retro-romance': buildNatureFamily(
    {
      accent: '#FFFFFF',
      gold: '#FFFFFF',
      ink: '#f0f0f0',
      muted: '#cccccc',
      bg: '#2a2a2a',
      card: '#3a3a3a',
    },
    O.spPetal,
    O.cdLeaf,
  ),
  'padang-red': buildNatureFamily(
    {
      accent: '#6C0000',
      gold: '#fd841b',
      ink: '#000000',
      muted: '#fd841b',
      bg: '#ffffff',
      card: '#ececec',
    },
    O.reCorner,
  ),
  'nea-pure': buildNatureFamily(
    {
      accent: '#551270',
      gold: '#8A3DA9',
      ink: '#212121',
      muted: '#8A3DA9',
      bg: '#ffffff',
      card: '#ececec',
    },
    O.spPetal,
    O.sbCrystal,
  ),
  'pink-envelope': buildNatureFamily(
    {
      accent: '#A67C83',
      gold: '#E6B1B4',
      ink: '#000000',
      muted: '#A67C83',
      bg: '#E6B1B4',
      card: '#f3d6d8',
    },
    O.spPetal,
  ),
  'java-emerald': buildNatureFamily(
    {
      accent: '#FFD69C',
      gold: '#FFD69C',
      ink: '#FFFFFF',
      muted: '#FFD69C',
      bg: '#1C3000',
      card: '#2a4010',
    },
    O.cdLeaf,
    O.batchFlourish,
  ),
  'java-atelier': buildNatureFamily(
    {
      accent: '#004869',
      gold: '#004869',
      ink: '#212121',
      muted: '#004869',
      bg: '#F5F0E7',
      card: '#ece6da',
    },
    O.egFlourish,
    O.cdLeaf,
  ),
  'maso-rustic': buildNatureFamily(
    {
      accent: '#322012',
      gold: '#322012',
      ink: '#000000',
      muted: '#6b4a32',
      bg: '#ffffff',
      card: '#ececec',
    },
    O.cdLeaf,
  ),
  'islamic-eternal': buildNatureFamily(
    {
      accent: '#A88000',
      gold: '#A88000',
      ink: '#ffffff',
      muted: '#A88000',
      bg: '#0A878E',
      card: '#097078',
    },
    O.sbCrystal,
    O.batchFlourish,
  ),
  'islamic-serenity': buildNatureFamily(
    {
      accent: '#E1BD68',
      gold: '#E1BD68',
      ink: '#FFFFFF',
      muted: '#E1BD68',
      bg: '#0A878E',
      card: '#097078',
    },
    O.egFlourish,
    O.sbCrystal,
  ),
  'islamic-pure': buildNatureFamily(
    {
      accent: '#094f43',
      gold: '#094f43',
      ink: '#FFFFFF',
      muted: '#094f43',
      bg: '#0A878E',
      card: '#097078',
    },
    O.batchFlourish,
    O.cdLeaf,
  ),
  'chinese-red': buildNatureFamily(
    {
      accent: '#A30000',
      gold: '#E1BD68',
      ink: '#000000',
      muted: '#E1BD68',
      bg: '#A30000',
      card: '#ececec',
    },
    O.reCorner,
    O.egFlourish,
  ),
}

function mergeTransform(
  base: SlotTransform,
  partial?: Partial<SlotTransform> | null,
): SlotTransform {
  return { ...base, ...(partial ?? {}) }
}

export function deepMergeThemeVisual(
  base: ThemeVisualStyle,
  partial?: Partial<ThemeVisualStyle> | null,
): ThemeVisualStyle {
  if (!partial) return structuredClone(base)
  const next = structuredClone(base)
  if (partial.colors) next.colors = { ...next.colors, ...partial.colors }
  if (typeof partial.showPetals === 'boolean') next.showPetals = partial.showPetals
  if (partial.ornamentMode) next.ornamentMode = partial.ornamentMode
  if (partial.cover) {
    const coverRaw = partial.cover as CoverVisual & Record<string, unknown>
    const hasOrnKeys =
      Array.isArray(coverRaw.ornaments) ||
      typeof coverRaw.ornamentTop === 'string' ||
      typeof coverRaw.ornamentBottom === 'string'
    const mergedOrnaments = hasOrnKeys
      ? migrateLegacyOrnamentSlots(
          coverRaw as unknown as Record<string, unknown>,
        )
      : next.cover.ornaments
    const cornerPatch = partial.cover.corners ?? {}
    next.cover = {
      ...next.cover,
      ...partial.cover,
      photoFrame: partial.cover.photoFrame || next.cover.photoFrame,
      ornaments:
        mergedOrnaments.length > 0 || !next.cover.ornaments.length
          ? mergedOrnaments
          : next.cover.ornaments,
      background: {
        ...next.cover.background,
        ...(partial.cover.background ?? {}),
      },
      textColors: {
        ...next.cover.textColors,
        ...(partial.cover.textColors ?? {}),
      },
      corners: {
        ...next.cover.corners,
        topLeft: cornerPatch.topLeft || next.cover.corners.topLeft,
        topRight: cornerPatch.topRight || next.cover.corners.topRight,
        bottomLeft: cornerPatch.bottomLeft || next.cover.corners.bottomLeft,
        bottomRight: cornerPatch.bottomRight || next.cover.corners.bottomRight,
      },
      photoFrameTransform: mergeTransform(
        next.cover.photoFrameTransform ?? emptyTransform(),
        partial.cover.photoFrameTransform,
      ),
    }
    if (!Array.isArray(next.cover.ornaments)) next.cover.ornaments = []
  }
  if (partial.sections) {
    for (const id of SECTION_IDS) {
      const p = partial.sections[id]
      if (!p) continue
      const pRaw = p as SectionVisual & Record<string, unknown>
      const hasOrnKeys =
        Array.isArray(pRaw.ornaments) ||
        typeof pRaw.ornamentTop === 'string' ||
        typeof pRaw.ornamentBottom === 'string'
      const mergedOrnaments = hasOrnKeys
        ? migrateLegacyOrnamentSlots(
            pRaw as unknown as Record<string, unknown>,
          )
        : next.sections[id].ornaments
      const framePatch = p.frames ?? {}
      next.sections[id] = {
        ...next.sections[id],
        ...p,
        ornaments:
          mergedOrnaments.length > 0 || !next.sections[id].ornaments.length
            ? mergedOrnaments
            : next.sections[id].ornaments,
        background: {
          ...next.sections[id].background,
          ...(p.background ?? {}),
        },
        frames: {
          cover: framePatch.cover || next.sections[id].frames.cover,
          groom: framePatch.groom || next.sections[id].frames.groom,
          bride: framePatch.bride || next.sections[id].frames.bride,
        },
        framesTransform: {
          cover: mergeTransform(
            next.sections[id].framesTransform?.cover ?? emptyTransform(),
            p.framesTransform?.cover,
          ),
          groom: mergeTransform(
            next.sections[id].framesTransform?.groom ?? emptyTransform(),
            p.framesTransform?.groom,
          ),
          bride: mergeTransform(
            next.sections[id].framesTransform?.bride ?? emptyTransform(),
            p.framesTransform?.bride,
          ),
        },
      }
      if (!Array.isArray(next.sections[id].ornaments)) {
        next.sections[id].ornaments = []
      }
    }
  }
  return next
}
