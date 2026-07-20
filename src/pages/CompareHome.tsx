import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import { useOptionalInvitation } from '../components/InvitationProvider'
import { logout } from '../lib/authStore'
import { THEME_LIST, type ThemeMeta } from '../lib/themeRegistry'
import { setActiveTheme } from '../lib/invitationStore'
import type { ThemeId } from '../lib/themeTypes'
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
      navigate('/invitations')
      return
    }
    navigate(inv?.activeId ? '/edit' : '/invitations')
  }

  const goEditTheme = (id: ThemeId) => {
    applyTheme(id)
    if (!user) {
      navigate('/login', { state: { from: '/invitations' } })
      return
    }
    if (user.role !== 'admin') {
      navigate('/invitations')
      return
    }
    navigate(inv?.activeId ? '/admin' : '/invitations')
  }

  return (
    <div className="home">
      <header className="home__nav">
        <Link to="/" className="home__logo">
          Vowly
        </Link>
        <div className="home__nav-actions">
          {user ? (
            <>
              <span className="home__user">
                {user.name}
                <em>{user.role === 'admin' ? 'Admin' : 'User'}</em>
              </span>
              <Link to="/invitations" className="home__btn home__btn--ghost">
                Undanganku
              </Link>
              {user.role === 'user' && inv?.activeId && (
                <Link to="/edit" className="home__btn home__btn--ghost">
                  Edit konten
                </Link>
              )}
              {user.role === 'admin' && inv?.activeId && (
                <Link to="/admin" className="home__btn home__btn--ghost">
                  Edit tema
                </Link>
              )}
              <button
                type="button"
                className="home__btn home__btn--ghost"
                onClick={() => {
                  void logout().then(() => navigate('/'))
                }}
              >
                Keluar
              </button>
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
        </div>
      </header>

      <section className="home__hero">
        <p className="home__brand">Vowly</p>
        <h1>Undangan digital yang siap dikustom.</h1>
        <p className="home__lead">
          Pilih tema, pratinjau bebas. Login untuk menyimpan undangan di cloud —
          user mengatur konten, admin mengatur tampilan tema.
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
            <Link to="/invitations" className="home__btn home__btn--solid">
              Kelola undanganku
            </Link>
          </div>
        )}
      </section>

      <section className="home__themes">
        <div className="home__themes-head">
          <h2>Tema undangan</h2>
          <p>Tiga tema siap pakai. Preview tanpa login.</p>
        </div>

        <div className="home__theme-grid">
          {THEME_LIST.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              blurb={THEME_BLURBS[theme.id]}
              role={user?.role ?? null}
              onPreview={() => applyTheme(theme.id)}
              onEditContent={() => goEditContent(theme.id)}
              onEditTheme={() => goEditTheme(theme.id)}
            />
          ))}
        </div>
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
  role,
  onPreview,
  onEditContent,
  onEditTheme,
}: {
  theme: ThemeMeta
  blurb: { tagline: string; tone: string }
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
        <h3>{theme.label}</h3>
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
              Edit tema
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
