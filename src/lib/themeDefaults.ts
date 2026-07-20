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

export const DEFAULT_THEME_STYLES: Record<ThemeId, ThemeVisualStyle> = {
  'super-classic': makeTheme(
    {
      accent: '#7a2f3d',
      gold: '#a67c52',
      ink: '#2c241c',
      muted: '#6b5e52',
      bg: '#f7f1e8',
      card: '#fffdf9',
    },
    { showPetals: true, ornamentMode: 'svg' },
  ),
  'elegan-grey': makeTheme({
    accent: '#928573',
    gold: '#9e9180',
    ink: '#2d2d2d',
    muted: '#6a5d4c',
    bg: '#ececec',
    card: '#ffffff',
  }),
  'blue-flowers': makeTheme({
    accent: '#005189',
    gold: '#359bb7',
    ink: '#1e1e1e',
    muted: '#2276b1',
    bg: '#ffffff',
    card: '#ffffff',
  }),
}

export { SECTION_IDS }

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
    next.cover = {
      ...next.cover,
      ...partial.cover,
      ornaments: hasOrnKeys
        ? migrateLegacyOrnamentSlots(
            coverRaw as unknown as Record<string, unknown>,
          )
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
        ...(partial.cover.corners ?? {}),
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
      next.sections[id] = {
        ...next.sections[id],
        ...p,
        ornaments: hasOrnKeys
          ? migrateLegacyOrnamentSlots(
              pRaw as unknown as Record<string, unknown>,
            )
          : next.sections[id].ornaments,
        background: {
          ...next.sections[id].background,
          ...(p.background ?? {}),
        },
        frames: {
          ...next.sections[id].frames,
          ...(p.frames ?? {}),
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
