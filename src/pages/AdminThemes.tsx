import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppAccount from '../components/AppAccount'
import { useAuth } from '../components/AuthProvider'
import {
  listThemesForAdmin,
  setThemePublishStatus,
  type ThemePublishStatus,
} from '../lib/themeTemplates'
import type { ThemeMeta } from '../lib/themeRegistry'
import type { ThemeId } from '../lib/themeTypes'
import './Invitations.css'

type AdminThemeRow = ThemeMeta & { status: ThemePublishStatus }

/** Admin: daftar template tema global (draft + published) */
export default function AdminThemesPage() {
  const user = useAuth()
  const [themes, setThemes] = useState<AdminThemeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<ThemeId | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setThemes(await listThemesForAdmin())
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat status. Pastikan SQL 004 sudah dijalankan.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const toggleStatus = async (themeId: ThemeId, status: ThemePublishStatus) => {
    setBusyId(themeId)
    setError(null)
    try {
      await setThemePublishStatus(themeId, status)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah status')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="inv">
      <header className="inv__nav">
        <Link to="/" className="inv__logo">
          Invite VERSE
        </Link>
        <div className="inv__nav-actions">
          <nav className="inv__nav-links" aria-label="Navigasi">
            <Link to="/" className="inv__btn inv__btn--ghost">
              Beranda
            </Link>
            <Link to="/admin/assist" className="inv__btn inv__btn--ghost">
              Antrian bantuan
            </Link>
            <Link to="/harga" className="inv__btn inv__btn--ghost">
              Harga
            </Link>
          </nav>
          {user && <AppAccount user={user} />}
        </div>
      </header>

      <main className="inv__main">
        <div className="inv__head">
          <h1>Template tema</h1>
          <p>
            Admin melihat semua template (baru & siap pakai). User hanya melihat
            yang berstatus <strong>published</strong>.
          </p>
        </div>

        {error && <p className="inv__banner is-error">{error}</p>}

        <section className="inv__list">
          <h2>Semua tema</h2>
          {loading ? (
            <p className="inv__empty">Memuat…</p>
          ) : (
            <ul>
              {themes.map((theme) => (
                <li key={theme.id}>
                  <div>
                    <strong>{theme.label}</strong>
                    <span
                      className={`inv__status inv__status--${theme.status === 'draft'}`}
                    >
                      {theme.status === 'published' ? 'siap pakai' : 'baru / draft'}
                    </span>
                    <p className="inv__meta">
                      {theme.fonts.display} · {theme.fonts.body} · {theme.route}
                    </p>
                  </div>
                  <div className="inv__row-actions">
                    <Link
                      to={`/admin?theme=${theme.id}`}
                      className="inv__btn inv__btn--solid"
                    >
                      Edit template
                    </Link>
                    <Link
                      to={theme.route}
                      className="inv__btn inv__btn--ghost"
                      target="_blank"
                    >
                      Preview
                    </Link>
                    {theme.status === 'published' ? (
                      <button
                        type="button"
                        className="inv__btn inv__btn--ghost"
                        disabled={busyId === theme.id}
                        onClick={() => void toggleStatus(theme.id, 'draft')}
                      >
                        Jadikan draft
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="inv__btn inv__btn--solid"
                        disabled={busyId === theme.id}
                        onClick={() =>
                          void toggleStatus(theme.id, 'published')
                        }
                      >
                        Publish (siap pakai)
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
