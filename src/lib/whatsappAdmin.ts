/** WhatsApp admin — nomor dari VITE_ADMIN_WHATSAPP (digit internasional, tanpa +). */

export function getAdminWhatsAppNumber(): string | null {
  const raw = (import.meta.env.VITE_ADMIN_WHATSAPP as string | undefined)?.trim()
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  return digits.length >= 8 ? digits : null
}

export function isAdminWhatsAppConfigured(): boolean {
  return getAdminWhatsAppNumber() !== null
}

/** URL wa.me; null jika nomor belum diisi di .env */
export function adminWhatsAppUrl(message: string): string | null {
  const number = getAdminWhatsAppNumber()
  if (!number) return null
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function openAdminWhatsApp(message: string): boolean {
  const url = adminWhatsAppUrl(message)
  if (!url) return false
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}

export function generalAssistWhatsAppMessage(): string {
  return (
    'Halo Invite VERSE,\n\n' +
    'Saya ingin dibantu membuat undangan digital. Mohon info selanjutnya. Terima kasih.'
  )
}

export function themeAssistWhatsAppMessage(input: {
  themeLabel: string
  invitationTitle?: string
}): string {
  const title = input.invitationTitle?.trim()
  return (
    `Halo Invite VERSE,\n\n` +
    `Saya ingin dibantu mengisi konten undangan.\n` +
    `Tema: *${input.themeLabel}*` +
    (title ? `\nUndangan: *${title}*` : '') +
    `\n\nTerima kasih.`
  )
}
