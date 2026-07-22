import type { CSSProperties } from 'react'
import {
  DEFAULT_THEME_STYLES,
  deepMergeThemeVisual,
  emptyTransform,
} from './themeDefaults'
import { isThemeId } from './themeRegistry'
import type {
  SectionId,
  SectionVisual,
  SlotBackground,
  SlotTransform,
  ThemeId,
  ThemeVisualStyle,
} from './themeTypes'

/** Legacy flat themeStyle (pre multi-theme) */
type LegacyThemeStyle = {
  ornamentMode?: 'svg' | 'image'
  showPetals?: boolean
  colors?: Partial<ThemeVisualStyle['colors']>
  backgroundImage?: string
  ornaments?: Partial<ThemeVisualStyle['cover']['corners']>
}

export function resolveActiveTheme(
  activeTheme: string | undefined,
  legacyTheme?: string,
): ThemeId {
  if (activeTheme && isThemeId(activeTheme)) return activeTheme
  if (legacyTheme && isThemeId(legacyTheme)) return legacyTheme
  return 'super-classic'
}

export function getThemeVisual(
  themeStyles: Partial<Record<ThemeId, ThemeVisualStyle>> | undefined,
  themeId: ThemeId,
): ThemeVisualStyle {
  return deepMergeThemeVisual(
    DEFAULT_THEME_STYLES[themeId],
    themeStyles?.[themeId],
  )
}

export function getSectionVisual(
  visual: ThemeVisualStyle,
  sectionId: SectionId,
): SectionVisual {
  return (
    visual.sections[sectionId] ??
    DEFAULT_THEME_STYLES['super-classic'].sections[sectionId]
  )
}

export function slotBackgroundStyle(
  bg: SlotBackground | undefined,
  fallbackColor?: string,
): CSSProperties {
  if (!bg) {
    return fallbackColor ? { backgroundColor: fallbackColor } : {}
  }
  if (bg.mode === 'image' && bg.image) {
    return {
      backgroundImage: `url(${bg.image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: bg.color || fallbackColor || undefined,
    }
  }
  const color = bg.color || fallbackColor
  return color ? { backgroundColor: color } : {}
}

export function slotTransformStyle(
  t?: SlotTransform | null,
): CSSProperties {
  const x = t?.offsetX ?? 0
  const y = t?.offsetY ?? 0
  const s = t?.scale ?? 1
  const r = t?.rotate ?? 0
  if (!x && !y && s === 1 && !r) return {}
  return {
    transform: `translate(${x}%, ${y}%) scale(${s}) rotate(${r}deg)`,
  }
}

/**
 * Posisi ornamen bebas relatif pusat parent.
 * offsetX/Y = % dari lebar/tinggi parent (0 = tengah).
 * flipX/Y = cermin horizontal/vertikal.
 */
export function freeOrnamentStyle(
  t?: SlotTransform | null,
  flip?: { flipX?: boolean; flipY?: boolean } | null,
): CSSProperties {
  const x = t?.offsetX ?? 0
  const y = t?.offsetY ?? 0
  const s = t?.scale ?? 1
  const r = t?.rotate ?? 0
  const sx = (flip?.flipX ? -1 : 1) * s
  const sy = (flip?.flipY ? -1 : 1) * s
  return {
    left: `${50 + x}%`,
    top: `${50 + y}%`,
    transform: `translate(-50%, -50%) scale(${sx}, ${sy}) rotate(${r}deg)`,
  }
}

export function normalizeTransform(
  t?: Partial<SlotTransform> | null,
): SlotTransform {
  return { ...emptyTransform(), ...(t ?? {}) }
}

/** Migrate old single themeStyle into themeStyles.super-classic */
export function migrateLegacyThemeStyle(
  legacy: LegacyThemeStyle | undefined,
  existing?: Partial<Record<ThemeId, ThemeVisualStyle>>,
): Record<ThemeId, ThemeVisualStyle> {
  const map = {} as Record<ThemeId, ThemeVisualStyle>
  for (const id of Object.keys(DEFAULT_THEME_STYLES) as ThemeId[]) {
    map[id] = deepMergeThemeVisual(DEFAULT_THEME_STYLES[id], existing?.[id])
  }

  if (!legacy) return map

  const sc = map['super-classic']
  if (legacy.colors) sc.colors = { ...sc.colors, ...legacy.colors }
  if (typeof legacy.showPetals === 'boolean') sc.showPetals = legacy.showPetals
  if (legacy.ornamentMode) sc.ornamentMode = legacy.ornamentMode
  if (legacy.ornaments) {
    sc.cover.corners = { ...sc.cover.corners, ...legacy.ornaments }
    if (Object.values(legacy.ornaments).some(Boolean)) {
      sc.ornamentMode = legacy.ornamentMode ?? 'image'
    }
  }
  if (legacy.backgroundImage) {
    sc.cover.background = {
      mode: 'image',
      color: sc.colors.bg,
      image: legacy.backgroundImage,
    }
  } else if (legacy.colors?.bg) {
    sc.cover.background = {
      mode: 'color',
      color: legacy.colors.bg,
      image: '',
    }
  }

  return map
}

/** Compatibility shim: ThemeVisualStyle → shape lama Super-Classic Ornaments */
export function toLegacyThemeStyle(visual: ThemeVisualStyle) {
  return {
    ornamentMode: visual.ornamentMode,
    showPetals: visual.showPetals,
    colors: visual.colors,
    backgroundImage:
      visual.cover.background.mode === 'image'
        ? visual.cover.background.image
        : '',
    ornaments: visual.cover.corners,
  }
}
