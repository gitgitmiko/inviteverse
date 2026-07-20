import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import AppAccount from '../components/AppAccount'
import { useOptionalInvitation } from '../components/InvitationProvider'
import { useVisibleThemes } from '../hooks/useVisibleThemes'
import type { ThemeMeta } from '../lib/themeRegistry'
import { setActiveTheme } from '../lib/invitationStore'
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
}

export default function CompareHome() {
  const user = useAuth()
  const navigate = useNavigate()
  const inv = useOptionalInvitation()
  const { themes, loading: themesLoading, isAdmin } = useVisibleThemes()

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

  return (
    <div className="home">
      <header className="home__nav">
        <Link to="/" className="home__logo">
          Invite VERSE
        </Link>
        <div className="home__nav-actions">
          <nav className="home__nav-links" aria-label="Navigasi utama">
            <Link to="/harga" className="home__btn home__btn--ghost">
              Harga
            </Link>
            {user ? (
              <>
                <Link
                  to={user.role === 'admin' ? '/themes' : '/invitations'}
                  className="home__btn home__btn--ghost"
                >
                  {user.role === 'admin' ? 'Template tema' : 'Undanganku'}
                </Link>
                {user.role === 'user' && inv?.activeId && (
                  <Link to="/edit" className="home__btn home__btn--ghost">
                    Edit konten
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/themes" className="home__btn home__btn--ghost">
                    Edit template
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
        <p className="home__brand">Invite VERSE</p>
        <h1>Undangan digital yang siap dikustom.</h1>
        <p className="home__lead">
          Pilih tema, pratinjau bebas. User membuat undangan & mengedit konten;
          admin mengelola template tema global (ornamen & visual).
        </p>
        {!user && (
          <div className="home__hero-cta">
            <Link to="/register" className="home__btn home__btn--solid">
              Mulai gratis
            </Link>
            <Link to="/login" className="home__btn home__btn--ghost-light">
              Sudah punya akun
            </Link>
          </div>
        )}
        {user && (
          <div className="home__hero-cta">
            <Link
              to={user.role === 'admin' ? '/themes' : '/invitations'}
              className="home__btn home__btn--solid"
            >
              {user.role === 'admin'
                ? 'Kelola template tema'
                : 'Kelola undanganku'}
            </Link>
          </div>
        )}
      </section>

      <section className="home__themes">
        <div className="home__themes-head">
          <h2>Tema undangan</h2>
          <p>
            {isAdmin
              ? 'Admin: semua template (draft & siap pakai).'
              : 'Hanya tema yang sudah siap pakai.'}
          </p>
        </div>

        {themesLoading ? (
          <p className="home__themes-empty">Memuat tema…</p>
        ) : themes.length === 0 ? (
          <p className="home__themes-empty">
            Belum ada tema siap pakai. Admin perlu mem-publish template dulu.
          </p>
        ) : (
          <div className="home__theme-grid">
            {themes.map((theme) => (
              <ThemeCard
                key={theme.id}
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
                onPreview={() => applyTheme(theme.id)}
                onEditContent={() => goEditContent(theme.id)}
                onEditTheme={() => goEditTheme(theme.id)}
              />
            ))}
          </div>
        )}
      </section>

      <footer className="home__foot">
        <p>
          Demo akun — buat di Supabase Auth, set role admin lewat SQL. Admin:{' '}
          <code>admin@demo.com</code> / <code>admin123</code> · User:{' '}
          <code>user@demo.com</code> / <code>user123</code>
        </p>
      </footer>
    </div>
  )
}

function ThemeCard({
  theme,
  blurb,
  status,
  showStatus,
  role,
  onPreview,
  onEditContent,
  onEditTheme,
}: {
  theme: ThemeMeta
  blurb: { tagline: string; tone: string }
  status?: ThemePublishStatus
  showStatus?: boolean
  role: 'user' | 'admin' | null
  onPreview: () => void
  onEditContent: () => void
  onEditTheme: () => void
}) {
  return (
    <article className={`home-theme home-theme--${blurb.tone}`}>
      <div className="home-theme__visual" aria-hidden>
        <span className="home-theme__script">{theme.label}</span>
      </div>
      <div className="home-theme__body">
        <h3>
          {theme.label}
          {showStatus && status ? (
            <em className={`home-theme__badge home-theme__badge--${status}`}>
              {status === 'published' ? 'Siap pakai' : 'Draft'}
            </em>
          ) : null}
        </h3>
        <p>{blurb.tagline}</p>
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
            <button
              type="button"
              className="home__btn home__btn--ghost"
              onClick={onEditContent}
            >
              Edit konten
            </button>
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
            <Link
              to="/login"
              state={{ from: '/invitations' }}
              className="home__btn home__btn--ghost"
            >
              Login untuk edit
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
