/** Resolusi nama tamu dari query URL undangan publik. */
export function resolveGuestNameFromSearch(
  searchParams: URLSearchParams,
  fallback = '',
): string {
  const raw =
    searchParams.get('to') ||
    searchParams.get('kpd') ||
    searchParams.get('nama') ||
    searchParams.get('guest') ||
    ''
  const name = raw.trim()
  return name || fallback
}

/** Link undangan personal: /i/{slug}?to=Nama+Tamu */
export function buildGuestInviteUrl(
  origin: string,
  slug: string,
  guestName: string,
): string {
  const base = origin.replace(/\/$/, '')
  const url = new URL(`${base}/i/${encodeURIComponent(slug)}`)
  const name = guestName.trim()
  if (name) url.searchParams.set('to', name)
  return url.toString()
}

export type InviteMessageTemplateId =
  | 'formal'
  | 'hangat'
  | 'singkat'
  | 'whatsapp'

export const INVITE_MESSAGE_TEMPLATES: {
  id: InviteMessageTemplateId
  label: string
  desc: string
}[] = [
  {
    id: 'formal',
    label: 'Formal',
    desc: 'Sopan, cocok keluarga & undangan resmi',
  },
  {
    id: 'hangat',
    label: 'Hangat',
    desc: 'Ramah & personal',
  },
  {
    id: 'singkat',
    label: 'Singkat',
    desc: 'Minimal, langsung ke link',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    desc: 'Siap kirim chat WA',
  },
]

type MessageInput = {
  guestName: string
  groomNickname: string
  brideNickname: string
  eventTitle?: string
  inviteUrl: string
  templateId: InviteMessageTemplateId
}

export function generateInviteMessage(input: MessageInput): string {
  const guest = input.guestName.trim() || 'Bapak/Ibu/Saudara/i'
  const couple = `${input.groomNickname} & ${input.brideNickname}`
  const acara = input.eventTitle?.trim() || 'pernikahan'
  const link = input.inviteUrl

  switch (input.templateId) {
    case 'formal':
      return (
        `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\n` +
        `Dengan hormat,\n` +
        `Tanpa mengurangi rasa hormat, kami mengundang ${guest} untuk menghadiri acara ${acara} kami,\n` +
        `${couple}.\n\n` +
        `Merupakan suatu kehormatan bagi kami apabila ${guest} berkenan hadir dan memberikan doa restu.\n\n` +
        `Detail undangan:\n${link}\n\n` +
        `Hormat kami,\n${couple}\n\n` +
        `Wassalamu'alaikum Warahmatullahi Wabarakatuh.`
      )
    case 'hangat':
      return (
        `Halo ${guest} 🌿\n\n` +
        `Dengan penuh sukacita, kami ${couple} mengundang Anda untuk hadir di hari bahagia kami.\n\n` +
        `Doa dan kehadiran Anda sangat berarti.\n` +
        `Buka undangan di sini:\n${link}\n\n` +
        `Sampai jumpa,\n${couple}`
      )
    case 'singkat':
      return (
        `Yth. ${guest},\n\n` +
        `Anda diundang ke ${acara} ${couple}.\n` +
        `${link}`
      )
    case 'whatsapp':
      return (
        `Assalamualaikum ${guest},\n\n` +
        `Kami sekeluarga mengundang Bapak/Ibu/Saudara/i untuk menghadiri resepsi pernikahan kami:\n` +
        `*${couple}*\n\n` +
        `Silakan buka undangan digital berikut:\n` +
        `${link}\n\n` +
        `Terima kasih atas doa restunya 🙏`
      )
    default:
      return `${guest} — ${link}`
  }
}

export function whatsappShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}
