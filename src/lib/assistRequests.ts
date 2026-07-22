import { requireSupabase } from './supabase'
import type { ThemeId } from './themeTypes'

export type AssistRequestStatus =
  | 'pending'
  | 'in_progress'
  | 'done'
  | 'cancelled'

export type AssistRequestRow = {
  id: string
  owner_id: string
  invitation_id: string
  theme_id: ThemeId
  status: AssistRequestStatus
  note: string | null
  created_at: string
  updated_at: string
}

export type AssistRequestAdminRow = AssistRequestRow & {
  owner_name: string
  invitation_title: string
  invitation_slug: string
}

export async function createAssistRequest(input: {
  invitationId: string
  themeId: ThemeId
  note?: string
}): Promise<AssistRequestRow> {
  const client = requireSupabase()
  const { data: session } = await client.auth.getUser()
  if (!session.user) throw new Error('Belum login')

  const { data, error } = await client
    .from('assist_requests')
    .insert({
      owner_id: session.user.id,
      invitation_id: input.invitationId,
      theme_id: input.themeId,
      status: 'pending',
      note: input.note ?? null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as AssistRequestRow
}

export async function listMyAssistRequests(): Promise<AssistRequestRow[]> {
  const client = requireSupabase()
  const { data: session } = await client.auth.getUser()
  if (!session.user) throw new Error('Belum login')

  const { data, error } = await client
    .from('assist_requests')
    .select('*')
    .eq('owner_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as AssistRequestRow[]
}

export async function listAssistRequestsAdmin(): Promise<
  AssistRequestAdminRow[]
> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('assist_requests')
    .select(
      `
      *,
      profiles:owner_id ( name ),
      invitations:invitation_id ( title, slug )
    `,
    )
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => {
    const r = row as AssistRequestRow & {
      profiles?: { name?: string } | null
      invitations?: { title?: string; slug?: string } | null
    }
    return {
      id: r.id,
      owner_id: r.owner_id,
      invitation_id: r.invitation_id,
      theme_id: r.theme_id,
      status: r.status,
      note: r.note,
      created_at: r.created_at,
      updated_at: r.updated_at,
      owner_name: r.profiles?.name?.trim() || 'User',
      invitation_title: r.invitations?.title?.trim() || 'Undangan',
      invitation_slug: r.invitations?.slug ?? '',
    }
  })
}

export async function updateAssistStatus(
  id: string,
  status: AssistRequestStatus,
): Promise<AssistRequestRow> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('assist_requests')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as AssistRequestRow
}

/** Cari request terbuka untuk undangan (pending / in_progress) */
export async function findOpenAssistForInvitation(
  invitationId: string,
): Promise<AssistRequestRow | null> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('assist_requests')
    .select('*')
    .eq('invitation_id', invitationId)
    .in('status', ['pending', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return (data as AssistRequestRow | null) ?? null
}
