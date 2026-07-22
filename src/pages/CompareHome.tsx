import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import AppAccount from '../components/AppAccount'
import ThemePhoneThumb from '../components/ThemePhoneThumb'
import { useOptionalInvitation } from '../components/InvitationProvider'
import { useVisibleThemes } from '../hooks/useVisibleThemes'
import type { ThemeMeta } from '../lib/themeRegistry'
import { THEME_REGISTRY } from '../lib/themeRegistry'
import { setActiveTheme } from '../lib/invitationStore'
import { requestAdminAssist } from '../lib/requestAdminAssist'
import {
  generalAssistWhatsAppMessage,
  isAdminWhatsAppConfigured,
  openAdminWhatsApp,
} from '../lib/whatsappAdmin'
import type { ThemeId } from '../lib/themeTypes'
import type { ThemePublishStatus } from '../lib/themeTemplates'
import './CompareHome.css'

const THEME_BLURBS: Record<
  ThemeId,
  { tagline: string; tone: string }
> = {
  'super-classic': {
    tagline: 'Klasik hangat dengan ornamen & petal lembut.',
    tone: 'cream',
  },
  'elegan-grey': {
    tagline: 'Abu elegan, tipografi Playfair, cover full-bleed.',
    tone: 'grey',
  },
  'blue-flowers': {
    tagline: 'Biru lembut, foto lingkaran & aksen bunga.',
    tone: 'blue',
  },
  'classic-devotion': {
    tagline: 'Elegan taupe, nuansa klasik hangat.',
    tone: 'taupe',
  },
  'red-essence': {
    tagline: 'Merah wine elegan.',
    tone: 'red',
  },
  'snow-blue': {
    tagline: 'Biru salju lembut.',
    tone: 'snow-blue',
  },
  'snow-pink': {
    tagline: 'Pink soft floral.',
    tone: 'snow-pink',
  },
  'burgundy-pure': {
    tagline: 'Burgundy & emas, bingkai pill.',
    tone: 'burgundy',
  },
  'bear-brown': {
    tagline: 'Cokelat hangat, bingkai arch atas.',
    tone: 'bear',
  },
  'infinite-gallop': {
    tagline: 'Merah galop & aksen emas.',
    tone: 'gallop',
  },
  'sun-moon': {
    tagline: 'Oranye matahari, arch tinggi.',
    tone: 'sun',
  },
  'royal-mega': {
    tagline: 'Emas royal, bingkai pill.',
    tone: 'royal',
  },
  'retro-romance': {
    tagline: 'Retro gelap, bingkai rounded.',
    tone: 'retro',
  },
  'padang-red': {
    tagline: 'Merah Padang & oranye.',
    tone: 'padang',
  },
  'nea-pure': {
    tagline: 'Ungu soft, arch atas.',
    tone: 'nea',
  },
  'pink-envelope': {
    tagline: 'Pink lembut, sampul envelope.',
    tone: 'snow-pink',
  },
  'java-emerald': {
    tagline: 'Hijau zamrud Jawa.',
    tone: 'cream',
  },
  'java-atelier': {
    tagline: 'Atelier Jawa, senyap elegan.',
    tone: 'taupe',
  },
  'maso-rustic': {
    tagline: 'Rustic hangat.',
    tone: 'bear',
  },
  'islamic-eternal': {
    tagline: 'Nuansa islami abadi.',
    tone: 'royal',
  },
  'islamic-serenity': {
    tagline: 'Tenang & khidmat.',
    tone: 'snow-blue',
  },
  'islamic-pure': {
    tagline: 'Teal pure, tipografi Lora.',
    tone: 'snow-blue',
  },
  'chinese-red': {
    tagline: 'Merah Cina & emas.',
    tone: 'gallop',
  },
}

export default function CompareHome() {
  const user = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const inv = useOptionalInvitation()
  const { themes, loading: themesLoading, isAdmin } = useVisibleThemes()
  const [assistMsg, setAssistMsg] = useState<string | null>(null)
  const [assistBusy, setAssistBusy] = useState<ThemeId | null>(null)
  const assistHandled = useRef(false)

  const applyTheme = (id: ThemeId) => {
    if (inv?.activeId) {
      inv.updateData((prev) => setActiveTheme(prev, id))
    }
  }

  const goEditContent = (id: ThemeId) => {
    applyTheme(id)
    if (!user) {
      navigate('/login', { state: { from: '/invitations' } })
      return
    }
    if (user.role !== 'user') {
      navigate('/themes')
      return
    }
    navigate(inv?.activeId ? '/edit' : '/invitations')
  }

  const goEditTheme = (id: ThemeId) => {
    if (!user) {
      navigate('/login', { state: { from: '/themes' } })
      return
    }
    if (user.role !== 'admin') {
      navigate('/invitations')
      return
    }
    navigate(`/admin?theme=${id}`)
  }

  const contactWhatsApp = () => {
    setAssistMsg(null)
    const opened = openAdminWhatsApp(generalAssistWhatsAppMessage())
    if (!opened) {
      setAssistMsg(
        'Nomor WhatsApp admin belum dikonfigurasi. Isi VITE_ADMIN_WHATSAPP di .env.',
      )
    }
  }

  const runAssist = useCallback(
    async (themeId: ThemeId) => {
      if (!user) {
        navigate('/login', {
          state: { from: `/?assist=${themeId}` },
        })
        return
      }
      if (user.role !== 'user') {
        setAssistMsg('Fitur ini untuk akun user (pemilik undangan).')
        return
      }
      if (!inv) {
        setAssistMsg('Sistem undangan belum siap.')
        return
      }
      setAssistBusy(themeId)
      setAssistMsg(null)
      try {
        const result = await requestAdminAssist({
          themeId,
          activeId: inv.activeId,
          createNew: inv.createNew,
          selectInvitation: inv.selectInvitation,
        })
        setAssistMsg(result.message)
      } catch (err) {
        setAssistMsg(
          err instanceof Error ? err.message : 'Gagal membuat permintaan',
        )
      } finally {
        setAssistBusy(null)
      }
    },
    [inv, navigate, user],
  )

  useEffect(() => {
    const assistTheme = params.get('assist') as ThemeId | null
    if (!assistTheme || !user || user.role !== 'user' || !inv) return
    if (assistHandled.current) return
    if (!THEME_REGISTRY[assistTheme]) return
    assistHandled.current = true
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('assist')
        return next
      },
      { replace: true },
    )
    void runAssist(assistTheme)
  }, [inv, params, runAssist, setParams, user])

  const waReady = isAdminWhatsAppConfigured()

  return (
    <div className="home">
      <header className="home__nav">
        <Link to="/" className="home__logo">
          Invite VERSE
        </Link>
        <div className="home__nav-actions">
          <nav className="home__nav-links" aria-label="Navigasi utama">
            <a href="#tema" className="home__btn home__btn--ghost">
              Tema
            </a>
            <Link to="/harga" className="home__btn home__btn--ghost">
              Harga
            </Link>
            <button
              type="button"
              className="home__btn home__btn--ghost"
              onClick={contactWhatsApp}
            >
              Hubungi WA
            </button>
            {user ? (
              <>
                <Link
                  to={user.role === 'admin' ? '/themes' : '/invitations'}
                  className="home__btn home__btn--ghost"
                >
                  {user.role === 'admin' ? 'Template tema' : 'Undanganku'}
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin/assist" className="home__btn home__btn--ghost">
                    Antrian bantuan
                  </Link>
                )}
                {user.role === 'user' && inv?.activeId && (
                  <Link to="/edit" className="home__btn home__btn--ghost">
                    Edit konten
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="home__btn home__btn--ghost">
                  Masuk
                </Link>
                <Link to="/register" className="home__btn home__btn--solid">
                  Daftar
                </Link>
              </>
            )}
          </nav>
          {user && <AppAccount user={user} />}
        </div>
      </header>

      <section className="home__hero">
        <div className="home__hero-copy">
          <p className="home__brand">Invite VERSE</p>
          <h1>Undangan digital yang terasa personal.</h1>
          <p className="home__lead">
            Pilih tema, isi sendiri, atau minta admin yang bantu. Satu tautan
            siap dibagikan ke tamu.
          </p>
          <div className="home__hero-cta">
            {!user && (
              <>
                <Link to="/register" className="home__btn home__btn--solid">
                  Mulai gratis
                </Link>
                <button
                  type="button"
                  className="home__btn home__btn--ghost-light"
                  onClick={contactWhatsApp}
                >
                  Hubungi WhatsApp
                </button>
              </>
            )}
            {user?.role === 'user' && (
              <>
                <Link to="/invitations" className="home__btn home__btn--solid">
                  Kelola undanganku
                </Link>
                <button
                  type="button"
                  className="home__btn home__btn--ghost-light"
                  onClick={contactWhatsApp}
                >
                  Hubungi WhatsApp
                </button>
              </>
            )}
            {user?.role === 'admin' && (
              <>
                <Link to="/themes" className="home__btn home__btn--solid">
                  Kelola template
                </Link>
                <Link
                  to="/admin/assist"
                  className="home__btn home__btn--ghost-light"
                >
                  Antrian bantuan
                </Link>
              </>
            )}
          </div>
          {!waReady && (
            <p className="home__wa-hint">
              Tip: isi <code>VITE_ADMIN_WHATSAPP</code> agar tombol WA aktif.
            </p>
          )}
        </div>
      </section>

      {assistMsg && (
        <p className="home__banner" role="status">
          {assistMsg}
        </p>
      )}

      <section className="home__steps" aria-labelledby="cara-kerja">
        <h2 id="cara-kerja">Cara kerja</h2>
        <ol className="home__step-list">
          <li>
            <strong>Pilih tema</strong>
            <span>Pratinjau cover seperti di layar HP.</span>
          </li>
          <li>
            <strong>Isi atau minta dibuatin</strong>
            <span>Edit sendiri, atau kirim ke admin lewat antrian.</span>
          </li>
          <li>
            <strong>Bagikan tautan</strong>
            <span>Publish dan sebar undangan ke tamu.</span>
          </li>
        </ol>
      </section>

      <section className="home__themes" id="tema">
        <div className="home__themes-head">
          <h2>Katalog tema</h2>
          <p>
            {isAdmin
              ? 'Admin: semua template (draft & siap pakai).'
              : 'Pilih tema — preview, edit sendiri, atau minta dibuatin admin.'}
          </p>
        </div>

        {themesLoading ? (
          <p className="home__themes-empty">Memuat tema…</p>
        ) : themes.length === 0 ? (
          <p className="home__themes-empty">
            Belum ada tema siap pakai. Admin perlu mem-publish template dulu.
          </p>
        ) : (
          <ol className="home__theme-list">
            {themes.map((theme, i) => (
              <ThemeCard
                key={theme.id}
                index={i + 1}
                theme={theme}
                blurb={
                  THEME_BLURBS[theme.id] ?? {
                    tagline: 'Template undangan.',
                    tone: 'cream',
                  }
                }
                status={theme.status}
                showStatus={isAdmin}
                role={user?.role ?? null}
                assistBusy={assistBusy === theme.id}
                onPreview={() => applyTheme(theme.id)}
                onEditContent={() => goEditContent(theme.id)}
                onEditTheme={() => goEditTheme(theme.id)}
                onAssist={() => void runAssist(theme.id)}
              />
            ))}
          </ol>
        )}
      </section>

      <section className="home__cta-band">
        <h2>Butuh dibantu mengisi konten?</h2>
        <p>
          Pilih tema di atas lalu ketuk Dibuatin Admin, atau hubungi kami lewat
          WhatsApp.
        </p>
        <div className="home__hero-cta">
          <button
            type="button"
            className="home__btn home__btn--solid"
            onClick={contactWhatsApp}
          >
            Hubungi WhatsApp
          </button>
          {!user && (
            <Link to="/register" className="home__btn home__btn--ghost-light">
              Daftar dulu
            </Link>
          )}
        </div>
      </section>

      <footer className="home__foot">
        <p>Invite VERSE — undangan digital untuk momen berharga.</p>
      </footer>
    </div>
  )
}

function ThemeCard({
  index,
  theme,
  blurb,
  status,
  showStatus,
  role,
  assistBusy,
  onPreview,
  onEditContent,
  onEditTheme,
  onAssist,
}: {
  index: number
  theme: ThemeMeta
  blurb: { tagline: string; tone: string }
  status?: ThemePublishStatus
  showStatus?: boolean
  role: 'user' | 'admin' | null
  assistBusy?: boolean
  onPreview: () => void
  onEditContent: () => void
  onEditTheme: () => void
  onAssist: () => void
}) {
  const previewUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${theme.route}`
      : theme.route

  return (
    <li className={`home-theme home-theme--${blurb.tone}`}>
      <Link
        to={theme.route}
        className="home-theme__phone"
        onClick={onPreview}
        aria-label={`Preview ${theme.label}`}
      >
        <ThemePhoneThumb themeId={theme.id} label={theme.label} index={index} />
      </Link>
      <div className="home-theme__body">
        <h3>
          <span className="home-theme__num">{index}.</span> {theme.label}
          {showStatus && status ? (
            <em className={`home-theme__badge home-theme__badge--${status}`}>
              {status === 'published' ? 'Siap pakai' : 'Draft'}
            </em>
          ) : (
            <em className="home-theme__badge home-theme__badge--new">New</em>
          )}
        </h3>
        <p className="home-theme__tagline">{blurb.tagline}</p>
        <a className="home-theme__link" href={theme.route}>
          {previewUrl}
        </a>
        <p className="home-theme__fonts">
          {theme.fonts.display} · {theme.fonts.body}
        </p>
        <div className="home-theme__actions">
          <Link
            to={theme.route}
            className="home__btn home__btn--solid"
            onClick={onPreview}
          >
            Preview
          </Link>
          {role === 'user' && (
            <>
              <button
                type="button"
                className="home__btn home__btn--ghost"
                onClick={onEditContent}
              >
                Edit konten
              </button>
              <button
                type="button"
                className="home__btn home__btn--ghost"
                disabled={assistBusy}
                onClick={onAssist}
              >
                {assistBusy ? 'Mengirim…' : 'Dibuatin Admin'}
              </button>
            </>
          )}
          {role === 'admin' && (
            <button
              type="button"
              className="home__btn home__btn--ghost"
              onClick={onEditTheme}
            >
              Edit template
            </button>
          )}
          {!role && (
            <>
              <button
                type="button"
                className="home__btn home__btn--ghost"
                onClick={onAssist}
              >
                Dibuatin Admin
              </button>
              <Link
                to="/login"
                state={{ from: '/invitations' }}
                className="home__btn home__btn--ghost"
              >
                Login untuk edit
              </Link>
            </>
          )}
        </div>
      </div>
    </li>
  )
}
