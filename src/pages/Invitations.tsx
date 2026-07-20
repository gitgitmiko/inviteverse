import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import { useInvitation } from '../components/InvitationProvider'
import {
  clearLegacyLocalInvitation,
  readLegacyLocalInvitation,
} from '../lib/invitationStore'
import { THEME_LIST, THEME_REGISTRY } from '../lib/themeRegistry'
import type { ThemeId } from '../lib/themeTypes'
import './Invitations.css'

export default function InvitationsPage() {
  const user = useAuth()
  const navigate = useNavigate()
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
  } = useInvitation()

  const [creating, setCreating] = useState(false)
  const [themePick, setThemePick] = useState<ThemeId>('super-classic')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const legacy = readLegacyLocalInvitation()

  const editorPath = user?.role === 'admin' ? '/admin' : '/edit'

  const onCreate = async () => {
    setCreating(true)
    setMsg(null)
    try {
      await createNew(themePick)
      navigate(editorPath)
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
      navigate(editorPath)
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
      navigate(editorPath)
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
          Vowly
        </Link>
        <div className="inv__nav-actions">
          <span className="inv__user">
            {user?.name}
            <em>{user?.role === 'admin' ? 'Admin' : 'User'}</em>
          </span>
          <Link to="/" className="inv__btn inv__btn--ghost">
            Beranda
          </Link>
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
          <label className="inv__field">
            Tema awal
            <select
              value={themePick}
              onChange={(e) => setThemePick(e.target.value as ThemeId)}
            >
              {THEME_LIST.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="inv__btn inv__btn--solid"
            disabled={creating || loading}
            onClick={() => void onCreate()}
          >
            {creating ? 'Membuat…' : 'Buat undangan'}
          </button>
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
              · slug: <code>{activeRow.slug}</code>
            </p>
            <div className="inv__row-actions">
              <Link to={editorPath} className="inv__btn inv__btn--solid">
                {user?.role === 'admin' ? 'Edit tema' : 'Edit konten'}
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
              ) : (
                <button
                  type="button"
                  className="inv__btn inv__btn--solid"
                  disabled={saving || busyId === activeRow.id}
                  onClick={() => void onPublish()}
                >
                  Publish
                </button>
              )}
            </div>
          </section>
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
                <li key={row.id} className={row.id === activeId ? 'is-active' : ''}>
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
