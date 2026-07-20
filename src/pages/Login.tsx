import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import { DEMO_ACCOUNTS, login } from '../lib/authStore'
import { isSupabaseConfigured } from '../lib/supabase'
import './Auth.css'

export default function LoginPage() {
  const user = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) {
    const dest =
      user.role === 'admin'
        ? from.startsWith('/admin') || from.startsWith('/themes')
          ? from
          : '/themes'
        : from.startsWith('/edit') || from.startsWith('/invitations')
          ? from
          : '/invitations'
    return <Navigate to={dest} replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await login(email, password)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    const role = result.user.role
    const dest =
      from.startsWith('/edit') ||
      from.startsWith('/admin') ||
      from.startsWith('/themes') ||
      from.startsWith('/invitations')
        ? from
        : role === 'admin'
          ? '/themes'
          : '/invitations'
    navigate(dest, { replace: true })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-back">
          ← Beranda
        </Link>
        <p className="auth-card__brand">Invite VERSE</p>
        <p className="auth-card__eyebrow">Undangan digital</p>
        <h1>Masuk</h1>
        <p className="auth-card__lead">
          Login untuk mengedit konten atau tema undangan.
        </p>

        {!isSupabaseConfigured && (
          <p className="auth-error">
            Supabase belum dikonfigurasi. Salin `.env.example` → `.env` dan isi
            URL + anon key. Lihat `supabase/README.md`.
          </p>
        )}

        <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
          {error && <p className="auth-error">{error}</p>}
          <label className="auth-field">
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="auth-field">
            Kata sandi
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? 'Masuk…' : 'Masuk'}
          </button>
        </form>

        <p className="auth-foot">
          Belum punya akun? <Link to="/register">Daftar</Link>
        </p>

        <div className="auth-demo">
          <strong>Akun demo</strong> (buat dulu di Supabase Auth, lalu set role
          admin lewat SQL — lihat <code>supabase/README.md</code>)
          <br />
          Admin: <code>{DEMO_ACCOUNTS.admin.email}</code> /{' '}
          <code>{DEMO_ACCOUNTS.admin.password}</code>
          <br />
          User: <code>{DEMO_ACCOUNTS.user.email}</code> /{' '}
          <code>{DEMO_ACCOUNTS.user.password}</code>
        </div>
      </div>
    </div>
  )
}
