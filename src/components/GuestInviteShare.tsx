import { useMemo, useState } from 'react'
import {
  buildGuestInviteUrl,
  generateInviteMessage,
  INVITE_MESSAGE_TEMPLATES,
  whatsappShareUrl,
  type InviteMessageTemplateId,
} from '../lib/guestInvite'
import './GuestInviteShare.css'

type Props = {
  slug: string
  groomNickname: string
  brideNickname: string
  eventTitle?: string
}

export default function GuestInviteShare({
  slug,
  groomNickname,
  brideNickname,
  eventTitle,
}: Props) {
  const [guestName, setGuestName] = useState('')
  const [templateId, setTemplateId] =
    useState<InviteMessageTemplateId>('whatsapp')
  const [copied, setCopied] = useState<'link' | 'msg' | null>(null)

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://example.com'

  const inviteUrl = useMemo(
    () => buildGuestInviteUrl(origin, slug, guestName),
    [origin, slug, guestName],
  )

  const message = useMemo(
    () =>
      generateInviteMessage({
        guestName,
        groomNickname,
        brideNickname,
        eventTitle,
        inviteUrl,
        templateId,
      }),
    [
      guestName,
      groomNickname,
      brideNickname,
      eventTitle,
      inviteUrl,
      templateId,
    ],
  )

  const flash = (kind: 'link' | 'msg') => {
    setCopied(kind)
    window.setTimeout(() => setCopied(null), 1400)
  }

  const copyText = async (text: string, kind: 'link' | 'msg') => {
    try {
      await navigator.clipboard.writeText(text)
      flash(kind)
    } catch {
      window.prompt('Salin teks ini:', text)
    }
  }

  return (
    <section className="gis">
      <h2>Undang tamu (personal)</h2>
      <p className="gis__lead">
        Isi nama tamu → dapat link & teks undangan. Saat dibuka, cover menampilkan{' '}
        <em>Yth. [nama]</em> lewat parameter <code>?to=</code> di akhir URL.
      </p>

      <label className="gis__field">
        Nama yang diundang
        <input
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Contoh: Soleh Solihun"
          autoComplete="off"
        />
      </label>

      <label className="gis__field">
        Template kata-kata
        <select
          value={templateId}
          onChange={(e) =>
            setTemplateId(e.target.value as InviteMessageTemplateId)
          }
        >
          {INVITE_MESSAGE_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label} — {t.desc}
            </option>
          ))}
        </select>
      </label>

      <div className="gis__block">
        <div className="gis__block-head">
          <strong>Link undangan</strong>
          <button
            type="button"
            className="gis__btn"
            onClick={() => void copyText(inviteUrl, 'link')}
          >
            {copied === 'link' ? 'Tersalin' : 'Salin link'}
          </button>
        </div>
        <code className="gis__link">{inviteUrl}</code>
        {!guestName.trim() && (
          <p className="gis__hint">
            Tip: isi nama agar link berisi <code>?to=…</code>
          </p>
        )}
      </div>

      <div className="gis__block">
        <div className="gis__block-head">
          <strong>Teks undangan</strong>
          <div className="gis__actions">
            <button
              type="button"
              className="gis__btn"
              onClick={() => void copyText(message, 'msg')}
            >
              {copied === 'msg' ? 'Tersalin' : 'Salin teks'}
            </button>
            <a
              className="gis__btn gis__btn--wa"
              href={whatsappShareUrl(message)}
              target="_blank"
              rel="noreferrer"
            >
              Kirim WA
            </a>
          </div>
        </div>
        <textarea className="gis__msg" rows={12} readOnly value={message} />
      </div>
    </section>
  )
}
