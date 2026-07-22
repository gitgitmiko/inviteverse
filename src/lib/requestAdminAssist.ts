import {
  getInvitationById,
  rowToInvitationData,
  saveInvitationRemote,
  setActiveTheme,
} from './invitationStore'
import { createAssistRequest } from './assistRequests'
import {
  openAdminWhatsApp,
  themeAssistWhatsAppMessage,
} from './whatsappAdmin'
import { THEME_REGISTRY } from './themeRegistry'
import type { ThemeId } from './themeTypes'
import type { InvitationRow } from './supabase'

type CreateNewFn = (themeId?: ThemeId) => Promise<InvitationRow>
type SelectFn = (id: string) => Promise<void>

/**
 * User: pastikan undangan bertema ini ada → buat assist_request → buka WA jika nomor terisi.
 */
export async function requestAdminAssist(opts: {
  themeId: ThemeId
  activeId: string | null
  createNew: CreateNewFn
  selectInvitation: SelectFn
}): Promise<{ message: string; waOpened: boolean }> {
  const { themeId, createNew, selectInvitation } = opts
  let invitationId = opts.activeId
  let invitationTitle: string | undefined

  if (!invitationId) {
    const row = await createNew(themeId)
    invitationId = row.id
    invitationTitle = row.title
  } else {
    const row = await getInvitationById(invitationId)
    const next = setActiveTheme(rowToInvitationData(row), themeId)
    const saved = await saveInvitationRemote(invitationId, next, {
      title: `${next.groomNickname} & ${next.brideNickname}`,
    })
    invitationTitle = saved.title
    await selectInvitation(invitationId)
  }

  await createAssistRequest({
    invitationId,
    themeId,
  })

  const themeLabel = THEME_REGISTRY[themeId]?.label ?? themeId
  const waOpened = openAdminWhatsApp(
    themeAssistWhatsAppMessage({
      themeLabel,
      invitationTitle,
    }),
  )

  if (waOpened) {
    return {
      message:
        'Permintaan terkirim ke antrian admin. Chat WhatsApp dibuka.',
      waOpened: true,
    }
  }
  return {
    message:
      'Permintaan masuk antrian admin. Nomor WhatsApp admin belum dikonfigurasi di .env.',
    waOpened: false,
  }
}
