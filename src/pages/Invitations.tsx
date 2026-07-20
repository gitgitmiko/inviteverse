import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppAccount from '../components/AppAccount'
import { useAuth } from '../components/AuthProvider'
import GuestInviteShare from '../components/GuestInviteShare'
import { useInvitation } from '../components/InvitationProvider'
import { useVisibleThemes } from '../hooks/useVisibleThemes'
import {
  clearLegacyLocalInvitation,
  readLegacyLocalInvitation,
} from '../lib/invitationStore'
import { THEME_REGISTRY } from '../lib/themeRegistry'
import type { ThemeId } from '../lib/themeTypes'
import './Invitations.css'

/** Halaman user: buat & kelola undangan sendiri */
export default function InvitationsPage() {
  const user = useAuth()
  const navigate = useNavigate()
  const { themes: publishedThemes, loading: themesLoading } =
    useVisibleThemes()
  const {
    list,
    activeId,
    loading,
    saving,
    error,
    selectInvitation,
    createNew,
    publish,
    unpublish,
    importLocalData,
    activeRow,
    remove,
    data,
    plan,
    benefits,
  } = useInvitation()

  const [creating, setCreating] = useState(false)
  const [themePick, setThemePick] = useState<ThemeId | ''>('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const legacy = readLegacyLocalInvitation()

  const effectiveTheme =
    (themePick && publishedThemes.some((t) => t.id === themePick)
      ? themePick
      : publishedThemes[0]?.id) ?? null

  const onCreate = async () => {
    if (!effectiveTheme) {
      setMsg('Belum ada tema siap pakai. Hubungi admin.')
      return
    }
    setCreating(true)
    setMsg(null)
    try {
      await createNew(effectiveTheme)
      navigate('/edit')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal membuat undangan')
    } finally {
      setCreating(false)
    }
  }

  const onOpen = async (id: string) => {
    setBusyId(id)
    setMsg(null)
    try {
      await selectInvitation(id)
      navigate('/edit')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal membuka')
    } finally {
      setBusyId(null)
    }
  }

  const onPublish = async () => {
    if (!activeId) return
    setBusyId(activeId)
    setMsg(null)
    try {
      await publish()
      setMsg('Undangan dipublikasikan.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal publish')
    } finally {
      setBusyId(null)
    }
  }

  const onUnpublish = async () => {
    if (!activeId) return
    setBusyId(activeId)
    try {
      await unpublish()
      setMsg('Status dikembalikan ke draft.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal')
    } finally {
      setBusyId(null)
    }
  }

  const onDelete = async (id: string, title: string) => {
    if (!window.confirm(`Hapus undangan “${title}”?`)) return
    setBusyId(id)
    try {
      await remove(id)
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal menghapus')
    } finally {
      setBusyId(null)
    }
  }

  const onImportLegacy = async () => {
    if (!legacy) return
    if (
      !window.confirm(
        'Impor data undangan dari browser (localStorage lama) sebagai undangan baru?',
      )
    ) {
      return
    }
    setCreating(true)
    try {
      await importLocalData(legacy)
      clearLegacyLocalInvitation()
      setMsg('Data lokal berhasil diimpor.')
      navigate('/edit')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Impor gagal')
    } finally {
      setCreating(false)
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
            <Link to="/harga" className="inv__btn inv__btn--ghost">
              Harga
            </Link>
          </nav>
          {user && <AppAccount user={user} />}
        </div>
      </header>

      <main className="inv__main">
        <div className="inv__head">
          <h1>Undanganku</h1>
          <p>Buat, pilih, dan publikasikan undangan. Data tersimpan di cloud.</p>
        </div>

        {(error || msg) && (
          <p className={`inv__banner ${error ? 'is-error' : ''}`}>
            {error || msg}
          </p>
        )}

        {legacy && (
          <div className="inv__import">
            <p>
              Ditemukan data undangan lama di browser ini. Impor sekali ke
              akunmu?
            </p>
            <button
              type="button"
              className="inv__btn inv__btn--solid"
              disabled={creating}
              onClick={() => void onImportLegacy()}
            >
              Impor data lokal
            </button>
            <button
              type="button"
              className="inv__btn inv__btn--ghost"
              onClick={() => {
                clearLegacyLocalInvitation()
                setMsg('Data lokal dihapus dari browser.')
              }}
            >
              Abaikan
            </button>
          </div>
        )}

        <section className="inv__create">
          <h2>Buat undangan baru</h2>
          {themesLoading ? (
            <p className="inv__empty">Memuat tema…</p>
          ) : publishedThemes.length === 0 ? (
            <p className="inv__empty">
              Belum ada tema siap pakai. Tunggu admin mem-publish template.
            </p>
          ) : (
            <>
              <label className="inv__field">
                Tema awal
                <select
                  value={effectiveTheme ?? ''}
                  onChange={(e) =>
                    setThemePick(e.target.value as ThemeId)
                  }
                >
                  {publishedThemes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="inv__btn inv__btn--solid"
                disabled={creating || loading || !effectiveTheme}
                onClick={() => void onCreate()}
              >
                {creating ? 'Membuat…' : 'Buat undangan'}
              </button>
            </>
          )}
        </section>

        {activeRow && (
          <section className="inv__active">
            <h2>Undangan aktif</h2>
            <p>
              <strong>{activeRow.title}</strong>
              <span className={`inv__status inv__status--${activeRow.status}`}>
                {activeRow.status}
              </span>
            </p>
            <p className="inv__meta">
              Tema:{' '}
              {THEME_REGISTRY[activeRow.active_theme as ThemeId]?.label ??
                activeRow.active_theme}{' '}
              · paket <strong>{plan.name}</strong> · slug:{' '}
              <code>{activeRow.slug}</code>
            </p>
            <div className="inv__row-actions">
              <Link to="/edit" className="inv__btn inv__btn--solid">
                Edit konten
              </Link>
              <Link to="/harga" className="inv__btn inv__btn--ghost">
                Upgrade paket
              </Link>
              {activeRow.status === 'published' ? (
                <>
                  <Link
                    to={`/i/${activeRow.slug}`}
                    className="inv__btn inv__btn--ghost"
                    target="_blank"
                  >
                    Buka publik
                  </Link>
                  <button
                    type="button"
                    className="inv__btn inv__btn--ghost"
                    disabled={saving || busyId === activeRow.id}
                    onClick={() => void onUnpublish()}
                  >
                    Unpublish
                  </button>
                </>
              ) : benefits.publish ? (
                <button
                  type="button"
                  className="inv__btn inv__btn--solid"
                  disabled={saving || busyId === activeRow.id}
                  onClick={() => void onPublish()}
                >
                  Publish
                </button>
              ) : (
                <div className="inv__publish-lock">
                  <p>
                    Paket <strong>{plan.name}</strong> tidak bisa publish /
                    sebar undangan.
                  </p>
                  <Link to="/harga" className="inv__btn inv__btn--solid">
                    Upgrade untuk publish
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {activeRow?.status === 'published' && (
          <GuestInviteShare
            slug={activeRow.slug}
            groomNickname={data.groomNickname}
            brideNickname={data.brideNickname}
            eventTitle={data.eventTitle}
          />
        )}

        <section className="inv__list">
          <h2>Daftar undangan</h2>
          {loading ? (
            <p className="inv__empty">Memuat…</p>
          ) : list.length === 0 ? (
            <p className="inv__empty">Belum ada undangan. Buat yang pertama.</p>
          ) : (
            <ul>
              {list.map((row) => (
                <li
                  key={row.id}
                  className={row.id === activeId ? 'is-active' : ''}
                >
                  <div>
                    <strong>{row.title}</strong>
                    <span className={`inv__status inv__status--${row.status}`}>
                      {row.status}
                    </span>
                    <p className="inv__meta">
                      {THEME_REGISTRY[row.active_theme as ThemeId]?.label} · /i/
                      {row.slug}
                    </p>
                  </div>
                  <div className="inv__row-actions">
                    <button
                      type="button"
                      className="inv__btn inv__btn--solid"
                      disabled={busyId === row.id}
                      onClick={() => void onOpen(row.id)}
                    >
                      Buka
                    </button>
                    <button
                      type="button"
                      className="inv__btn inv__btn--ghost"
                      disabled={busyId === row.id}
                      onClick={() => void onDelete(row.id, row.title)}
                    >
                      Hapus
                    </button>
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
