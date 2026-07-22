import defaultData from '../data/invitation.json'
import {
  deepMergeThemeVisual,
  DEFAULT_THEME_STYLES,
} from './themeDefaults'
import {
  getThemeVisual,
  migrateLegacyThemeStyle,
  resolveActiveTheme,
  toLegacyThemeStyle,
} from './themeStyle'
import type { ThemeId, ThemeVisualStyle } from './themeTypes'
import type { InvitationRow } from './supabase'
import { requireSupabase } from './supabase'
import { buildThemeStylesForNewInvitation, loadThemeStatuses } from './themeTemplates'

export type InvitationData = Omit<
  typeof defaultData,
  'themeStyles' | 'activeTheme' | 'theme' | 'themeStyle'
> & {
  theme: ThemeId
  activeTheme: ThemeId
  themeStyles: Record<ThemeId, ThemeVisualStyle>
  themeStyle?: ReturnType<typeof toLegacyThemeStyle>
}

export type ThemeStyle = ReturnType<typeof toLegacyThemeStyle>

const LEGACY_STORAGE_KEY = 'wedding-invitation-v2-data'
const ACTIVE_ID_KEY = 'wedding-invitation-v2-active-id'

export function normalizeInvitation(
  raw: Partial<InvitationData> & { themeStyle?: unknown; theme?: string },
): InvitationData {
  const base = structuredClone(defaultData) as unknown as InvitationData
  const activeTheme = resolveActiveTheme(
    raw.activeTheme as string | undefined,
    (raw.theme as string | undefined) ?? base.theme,
  )

  const migrated = migrateLegacyThemeStyle(
    raw.themeStyle as Parameters<typeof migrateLegacyThemeStyle>[0],
    raw.themeStyles as Partial<Record<ThemeId, ThemeVisualStyle>> | undefined,
  )

  const themeStyles = {} as Record<ThemeId, ThemeVisualStyle>
  for (const id of Object.keys(DEFAULT_THEME_STYLES) as ThemeId[]) {
    const fromBase = base.themeStyles?.[id] as ThemeVisualStyle | undefined
    themeStyles[id] = deepMergeThemeVisual(
      DEFAULT_THEME_STYLES[id],
      fromBase
        ? deepMergeThemeVisual(fromBase, migrated[id])
        : migrated[id],
    )
  }

  return {
    ...base,
    ...raw,
    theme: activeTheme,
    activeTheme,
    themeStyles,
    verse: { ...base.verse, ...raw.verse },
    groom: { ...base.groom, ...raw.groom },
    bride: { ...base.bride, ...raw.bride },
    story: {
      ...base.story,
      ...raw.story,
      items: raw.story?.items ?? base.story.items,
    },
    liveStreaming: { ...base.liveStreaming, ...raw.liveStreaming },
    rsvp: { ...base.rsvp, ...raw.rsvp },
    gift: {
      ...base.gift,
      ...raw.gift,
      accounts: raw.gift?.accounts ?? base.gift.accounts,
    },
    events: raw.events ?? base.events,
    gallery: raw.gallery ?? base.gallery,
    timeline: raw.timeline ?? base.timeline,
  }
}

/** Default undangan (template) — untuk preview tema tanpa DB */
export function getDefaultInvitation(): InvitationData {
  return normalizeInvitation({})
}

/** Baca sisa data localStorage lama (untuk impor) */
export function readLegacyLocalInvitation(): InvitationData | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    return normalizeInvitation(JSON.parse(raw) as Partial<InvitationData>)
  } catch {
    return null
  }
}

export function clearLegacyLocalInvitation() {
  localStorage.removeItem(LEGACY_STORAGE_KEY)
}

export function getActiveInvitationId(): string | null {
  return localStorage.getItem(ACTIVE_ID_KEY)
}

export function setActiveInvitationId(id: string | null) {
  if (!id) localStorage.removeItem(ACTIVE_ID_KEY)
  else localStorage.setItem(ACTIVE_ID_KEY, id)
}

export function splitInvitationPayload(data: InvitationData) {
  const {
    themeStyles,
    activeTheme,
    theme: _theme,
    themeStyle: _ts,
    ...content
  } = data
  return {
    content: content as Record<string, unknown>,
    theme_styles: themeStyles,
    active_theme: activeTheme,
  }
}

export function rowToInvitationData(row: InvitationRow): InvitationData {
  return normalizeInvitation({
    ...(row.content as Partial<InvitationData>),
    activeTheme: row.active_theme,
    theme: row.active_theme,
    themeStyles: row.theme_styles as InvitationData['themeStyles'],
  })
}

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base || 'undangan'}-${suffix}`
}

export async function listMyInvitations(): Promise<InvitationRow[]> {
  const client = requireSupabase()
  const { data: session } = await client.auth.getUser()
  if (!session.user) throw new Error('Belum login')

  const { data, error } = await client
    .from('invitations')
    .select('*')
    .eq('owner_id', session.user.id)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as InvitationRow[]
}

/** User: milik sendiri. Admin: semua undangan (untuk edit tema). */
export async function listAccessibleInvitations(
  role: 'user' | 'admin',
): Promise<InvitationRow[]> {
  if (role !== 'admin') return listMyInvitations()

  const client = requireSupabase()
  const { data: session } = await client.auth.getUser()
  if (!session.user) throw new Error('Belum login')

  const { data, error } = await client
    .from('invitations')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as InvitationRow[]
}

async function assertCanCreateInvitation() {
  const client = requireSupabase()
  const { data: session } = await client.auth.getUser()
  if (!session.user) throw new Error('Belum login')

  const { data: profile, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) throw error
  if (profile?.role === 'admin') {
    throw new Error(
      'Akun admin tidak dapat membuat undangan. Admin hanya mengedit tema.',
    )
  }
}

async function assertThemePublished(themeId: ThemeId) {
  const statuses = await loadThemeStatuses()
  if (statuses[themeId] !== 'published') {
    throw new Error('Tema belum siap pakai. Pilih tema yang sudah di-publish.')
  }
}

export async function getInvitationById(id: string): Promise<InvitationRow> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('invitations')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as InvitationRow
}

export async function getInvitationBySlug(
  slug: string,
): Promise<InvitationRow | null> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('invitations')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (error) throw error
  return data as InvitationRow | null
}

export async function createInvitation(input?: {
  title?: string
  themeId?: ThemeId
  fromData?: InvitationData
}): Promise<InvitationRow> {
  await assertCanCreateInvitation()
  const client = requireSupabase()
  const { data: session } = await client.auth.getUser()
  if (!session.user) throw new Error('Belum login')

  const templateStyles = await buildThemeStylesForNewInvitation()

  const seed = input?.fromData
    ? normalizeInvitation(input.fromData)
    : normalizeInvitation({
        themeStyles: templateStyles,
        activeTheme: input?.themeId,
        theme: input?.themeId,
      })
  const themeId = input?.themeId ?? seed.activeTheme
  if (!input?.fromData) {
    await assertThemePublished(themeId)
  }
  const withTheme = setActiveTheme(
    {
      ...seed,
      themeStyles: input?.fromData ? seed.themeStyles : templateStyles,
    },
    themeId,
  )
  const payload = splitInvitationPayload(withTheme)
  const title =
    input?.title ||
    `${withTheme.groomNickname} & ${withTheme.brideNickname}` ||
    'Undangan Baru'

  const { data, error } = await client
    .from('invitations')
    .insert({
      owner_id: session.user.id,
      slug: slugify(title),
      title,
      status: 'draft',
      active_theme: payload.active_theme,
      content: payload.content,
      theme_styles: payload.theme_styles,
    })
    .select('*')
    .single()

  if (error) throw error
  const row = data as InvitationRow
  setActiveInvitationId(row.id)
  return row
}

/** Simpan hanya visual tema (untuk admin) */
export async function saveInvitationThemeRemote(
  id: string,
  data: InvitationData,
): Promise<InvitationRow> {
  const client = requireSupabase()
  const payload = splitInvitationPayload(data)
  const { data: row, error } = await client
    .from('invitations')
    .update({
      active_theme: payload.active_theme,
      theme_styles: payload.theme_styles,
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return row as InvitationRow
}

export async function saveInvitationRemote(
  id: string,
  data: InvitationData,
  extras?: { title?: string; status?: 'draft' | 'published' },
): Promise<InvitationRow> {
  const client = requireSupabase()
  const payload = splitInvitationPayload(data)
  const { data: row, error } = await client
    .from('invitations')
    .update({
      active_theme: payload.active_theme,
      content: payload.content,
      theme_styles: payload.theme_styles,
      ...(extras?.title ? { title: extras.title } : {}),
      ...(extras?.status ? { status: extras.status } : {}),
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return row as InvitationRow
}

export async function setInvitationStatus(
  id: string,
  status: 'draft' | 'published',
): Promise<InvitationRow> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('invitations')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as InvitationRow
}

export async function deleteInvitation(id: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('invitations').delete().eq('id', id)
  if (error) throw error
  if (getActiveInvitationId() === id) setActiveInvitationId(null)
}

/** @deprecated sync localStorage — gunakan saveInvitationRemote */
export function saveInvitation(data: InvitationData) {
  const { themeStyle: _drop, ...rest } = data as InvitationData & {
    themeStyle?: unknown
  }
  localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(rest))
}

/** @deprecated sync localStorage */
export function loadInvitation(): InvitationData {
  return readLegacyLocalInvitation() ?? getDefaultInvitation()
}

export function resetInvitation(): InvitationData {
  clearLegacyLocalInvitation()
  return getDefaultInvitation()
}

export function getDefaultThemeVisual(themeId: ThemeId): ThemeVisualStyle {
  const base = structuredClone(defaultData) as unknown as InvitationData
  return deepMergeThemeVisual(
    DEFAULT_THEME_STYLES[themeId],
    base.themeStyles?.[themeId] as ThemeVisualStyle | undefined,
  )
}

export function resetActiveThemeVisual(data: InvitationData): InvitationData {
  const id = data.activeTheme
  return {
    ...data,
    themeStyles: {
      ...data.themeStyles,
      [id]: getDefaultThemeVisual(id),
    },
  }
}

export function resetInvitationContent(data: InvitationData): InvitationData {
  const base = getDefaultInvitation()
  const { themeStyles: _d, activeTheme: _a, theme: _t, ...content } = base
  return {
    ...data,
    ...content,
    activeTheme: data.activeTheme,
    theme: data.activeTheme,
    themeStyles: data.themeStyles,
  }
}

export function getActiveVisual(data: InvitationData): ThemeVisualStyle {
  return getThemeVisual(data.themeStyles, data.activeTheme)
}

export function setActiveTheme(
  data: InvitationData,
  themeId: ThemeId,
): InvitationData {
  return { ...data, activeTheme: themeId, theme: themeId }
}

export function patchActiveThemeVisual(
  data: InvitationData,
  partial: Partial<ThemeVisualStyle>,
): InvitationData {
  const id = data.activeTheme
  const current = getThemeVisual(data.themeStyles, id)
  return {
    ...data,
    themeStyles: {
      ...data.themeStyles,
      [id]: deepMergeThemeVisual(current, partial),
    },
  }
}

export function getLegacyThemeStyle(data: InvitationData): ThemeStyle {
  return toLegacyThemeStyle(getActiveVisual(data))
}

export type { ThemeId, ThemeVisualStyle } from './themeTypes'
