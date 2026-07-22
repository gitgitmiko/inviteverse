import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppAccount from '../components/AppAccount'
import { useAuth } from '../components/AuthProvider'
import {
  listAssistRequestsAdmin,
  updateAssistStatus,
  type AssistRequestAdminRow,
  type AssistRequestStatus,
} from '../lib/assistRequests'
import { THEME_REGISTRY } from '../lib/themeRegistry'
import './Invitations.css'

const STATUS_LABEL: Record<AssistRequestStatus, string> = {
  pending: 'Menunggu',
  in_progress: 'Dikerjakan',
  done: 'Selesai',
  cancelled: 'Dibatalkan',
}

/** Admin: antrian permintaan “Dibuatin Admin” */
export default function AdminAssistPage() {
  const user = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState<AssistRequestAdminRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'open' | 'all'>('open')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await listAssistRequestsAdmin())
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat antrian. Pastikan migrasi 008 sudah dijalankan.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const visible = rows.filter((r) =>
    filter === 'open'
      ? r.status === 'pending' || r.status === 'in_progress'
      : true,
  )

  const openEdit = async (row: AssistRequestAdminRow) => {
    setBusyId(row.id)
    setError(null)
    try {
      if (row.status === 'pending') {
        await updateAssistStatus(row.id, 'in_progress')
      }
      navigate(
        `/admin/assist/${row.invitation_id}?request=${row.id}`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuka')
    } finally {
      setBusyId(null)
    }
  }

  const setStatus = async (
    id: string,
    status: AssistRequestStatus,
  ) => {
    setBusyId(id)
    setError(null)
    try {
      await updateAssistStatus(id, status)
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
            <Link to="/themes" className="inv__btn inv__btn--ghost">
              Template tema
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
          <h1>Antrian bantuan</h1>
          <p>
            User yang meminta admin mengisi konten undangan. Buka editor untuk
            mengedit, lalu tandai selesai.
          </p>
        </div>

        {error && <p className="inv__banner is-error">{error}</p>}

        <div className="inv__actions" style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            className={`inv__btn ${filter === 'open' ? 'inv__btn--solid' : 'inv__btn--ghost'}`}
            onClick={() => setFilter('open')}
          >
            Terbuka
          </button>
          <button
            type="button"
            className={`inv__btn ${filter === 'all' ? 'inv__btn--solid' : 'inv__btn--ghost'}`}
            onClick={() => setFilter('all')}
          >
            Semua
          </button>
          <button
            type="button"
            className="inv__btn inv__btn--ghost"
            onClick={() => void refresh()}
          >
            Muat ulang
          </button>
        </div>

        <section className="inv__list">
          <h2>
            {filter === 'open' ? 'Menunggu / dikerjakan' : 'Semua permintaan'}
          </h2>
          {loading ? (
            <p className="inv__empty">Memuat…</p>
          ) : visible.length === 0 ? (
            <p className="inv__empty">Belum ada permintaan.</p>
          ) : (
            <ul>
              {visible.map((row) => {
                const themeLabel =
                  THEME_REGISTRY[row.theme_id]?.label ?? row.theme_id
                const when = new Date(row.created_at).toLocaleString('id-ID', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
                return (
                  <li key={row.id}>
                    <div>
                      <strong>{row.owner_name}</strong>
                      <span
                        className={`inv__status inv__status--${row.status === 'done'}`}
                      >
                        {STATUS_LABEL[row.status]}
                      </span>
                      <p style={{ margin: '0.35rem 0 0', opacity: 0.85 }}>
                        {row.invitation_title} · {themeLabel}
                      </p>
                      <p
                        style={{
                          margin: '0.2rem 0 0',
                          fontSize: '0.8rem',
                          opacity: 0.65,
                        }}
                      >
                        {when}
                      </p>
                    </div>
                    <div className="inv__row-actions">
                      {(row.status === 'pending' ||
                        row.status === 'in_progress') && (
                        <>
                          <button
                            type="button"
                            className="inv__btn inv__btn--solid"
                            disabled={busyId === row.id}
                            onClick={() => void openEdit(row)}
                          >
                            Edit konten
                          </button>
                          <button
                            type="button"
                            className="inv__btn inv__btn--ghost"
                            disabled={busyId === row.id}
                            onClick={() => void setStatus(row.id, 'done')}
                          >
                            Selesai
                          </button>
                          <button
                            type="button"
                            className="inv__btn inv__btn--ghost"
                            disabled={busyId === row.id}
                            onClick={() => void setStatus(row.id, 'cancelled')}
                          >
                            Batalkan
                          </button>
                        </>
                      )}
                      {(row.status === 'done' ||
                        row.status === 'cancelled') && (
                        <button
                          type="button"
                          className="inv__btn inv__btn--ghost"
                          disabled={busyId === row.id}
                          onClick={() =>
                            navigate(
                              `/admin/assist/${row.invitation_id}?request=${row.id}`,
                            )
                          }
                        >
                          Lihat undangan
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
