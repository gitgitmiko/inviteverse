import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { ThemeId, ThemeVisualStyle } from './themeTypes'

export type ProfileRole = 'user' | 'admin'

export type ProfileRow = {
  id: string
  name: string
  role: ProfileRole
  created_at: string
  updated_at: string
}

export type InvitationStatus = 'draft' | 'published'

export type InvitationRow = {
  id: string
  owner_id: string
  slug: string
  title: string
  status: InvitationStatus
  active_theme: ThemeId
  content: Record<string, unknown>
  theme_styles: Partial<Record<ThemeId, ThemeVisualStyle>>
  created_at: string
  updated_at: string
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

/** Client Supabase; null jika env belum diisi */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env',
    )
  }
  return supabase
}
