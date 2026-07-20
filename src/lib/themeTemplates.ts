import defaultData from '../data/invitation.json'
import { requireSupabase, isSupabaseConfigured } from './supabase'
import { deepMergeThemeVisual, DEFAULT_THEME_STYLES } from './themeDefaults'
import { THEME_LIST, THEME_REGISTRY, type ThemeMeta } from './themeRegistry'
import type { ThemeId, ThemeVisualStyle } from './themeTypes'

export type ThemePublishStatus = 'draft' | 'published'

export type ThemeTemplateRow = {
  theme_id: ThemeId
  styles: ThemeVisualStyle
  status: ThemePublishStatus
  updated_at: string
}

function codeDefaultVisual(themeId: ThemeId): ThemeVisualStyle {
  const fromJson = (
    defaultData as unknown as {
      themeStyles?: Partial<Record<ThemeId, ThemeVisualStyle>>
    }
  ).themeStyles?.[themeId]
  return deepMergeThemeVisual(DEFAULT_THEME_STYLES[themeId], fromJson)
}

/** Visual default code + override dari DB (jika ada) */
export function mergeTemplateVisual(
  themeId: ThemeId,
  fromDb?: Partial<ThemeVisualStyle> | null,
): ThemeVisualStyle {
  return deepMergeThemeVisual(
    codeDefaultVisual(themeId),
    fromDb as ThemeVisualStyle | undefined,
  )
}

export async function loadThemeStatuses(): Promise<
  Record<ThemeId, ThemePublishStatus>
> {
  const base = {} as Record<ThemeId, ThemePublishStatus>
  for (const t of THEME_LIST) base[t.id] = 'draft'

  if (!isSupabaseConfigured) {
    for (const t of THEME_LIST) base[t.id] = 'published'
    return base
  }

  const client = requireSupabase()
  const { data, error } = await client
    .from('theme_templates')
    .select('theme_id, status')
  if (error) throw error

  for (const row of data ?? []) {
    const id = row.theme_id as ThemeId
    if (id in base) {
      base[id] = (row.status as ThemePublishStatus) || 'draft'
    }
  }
  return base
}

/** Tema yang boleh dilihat / dipilih user (dan tamu di beranda) */
export async function listPublishedThemes(): Promise<ThemeMeta[]> {
  const statuses = await loadThemeStatuses()
  return THEME_LIST.filter((t) => statuses[t.id] === 'published')
}

/** Semua tema di registry + status (untuk admin) */
export async function listThemesForAdmin(): Promise<
  Array<ThemeMeta & { status: ThemePublishStatus }>
> {
  const statuses = await loadThemeStatuses()
  return THEME_LIST.map((t) => ({
    ...t,
    status: statuses[t.id] ?? 'draft',
  }))
}

export async function getThemeTemplate(
  themeId: ThemeId,
): Promise<ThemeVisualStyle> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('theme_templates')
    .select('styles')
    .eq('theme_id', themeId)
    .maybeSingle()

  if (error) throw error
  return mergeTemplateVisual(
    themeId,
    (data?.styles as ThemeVisualStyle | undefined) ?? null,
  )
}

export async function loadAllThemeStyles(): Promise<
  Record<ThemeId, ThemeVisualStyle>
> {
  const client = requireSupabase()
  const { data, error } = await client.from('theme_templates').select('*')
  if (error) throw error

  const byId = new Map<string, ThemeVisualStyle>()
  for (const row of data ?? []) {
    byId.set(row.theme_id as string, row.styles as ThemeVisualStyle)
  }

  const result = {} as Record<ThemeId, ThemeVisualStyle>
  for (const t of THEME_LIST) {
    result[t.id] = mergeTemplateVisual(t.id, byId.get(t.id) ?? null)
  }
  return result
}

/** Fallback offline: hanya default code */
export function getCodeThemeStyles(): Record<ThemeId, ThemeVisualStyle> {
  const result = {} as Record<ThemeId, ThemeVisualStyle>
  for (const t of THEME_LIST) {
    result[t.id] = codeDefaultVisual(t.id)
  }
  return result
}

async function getExistingRow(themeId: ThemeId) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('theme_templates')
    .select('*')
    .eq('theme_id', themeId)
    .maybeSingle()
  if (error) throw error
  return data as ThemeTemplateRow | null
}

export async function saveThemeTemplate(
  themeId: ThemeId,
  styles: ThemeVisualStyle,
): Promise<ThemeTemplateRow> {
  const client = requireSupabase()
  const existing = await getExistingRow(themeId)
  const { data, error } = await client
    .from('theme_templates')
    .upsert(
      {
        theme_id: themeId,
        styles,
        status: existing?.status ?? 'draft',
      },
      { onConflict: 'theme_id' },
    )
    .select('*')
    .single()

  if (error) throw error
  return data as ThemeTemplateRow
}

export async function setThemePublishStatus(
  themeId: ThemeId,
  status: ThemePublishStatus,
): Promise<ThemeTemplateRow> {
  if (!THEME_REGISTRY[themeId]) {
    throw new Error('Tema tidak dikenal di registry')
  }
  const client = requireSupabase()
  const existing = await getExistingRow(themeId)
  const { data, error } = await client
    .from('theme_templates')
    .upsert(
      {
        theme_id: themeId,
        styles: existing?.styles ?? {},
        status,
      },
      { onConflict: 'theme_id' },
    )
    .select('*')
    .single()

  if (error) throw error
  return data as ThemeTemplateRow
}

/** Reset visual ke default code; status publish dipertahankan */
export async function resetThemeTemplate(
  themeId: ThemeId,
): Promise<ThemeVisualStyle> {
  const client = requireSupabase()
  const existing = await getExistingRow(themeId)
  const status = existing?.status ?? 'draft'
  const { error } = await client.from('theme_templates').upsert(
    {
      theme_id: themeId,
      styles: {},
      status,
    },
    { onConflict: 'theme_id' },
  )
  if (error) throw error
  return codeDefaultVisual(themeId)
}

/** Seed themeStyles untuk undangan baru (code + template admin) */
export async function buildThemeStylesForNewInvitation(): Promise<
  Record<ThemeId, ThemeVisualStyle>
> {
  try {
    return await loadAllThemeStyles()
  } catch {
    return getCodeThemeStyles()
  }
}
