import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import { register } from '../lib/authStore'
import { isSupabaseConfigured } from '../lib/supabase'
import './Auth.css'

export default function RegisterPage() {
  const user = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) {
    return <Navigate to="/invitations" replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await register({ name, email, password })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate('/invitations', { replace: true })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-back">
          ← Beranda
        </Link>
        <p className="auth-card__brand">Invite VERSE</p>
        <p className="auth-card__eyebrow">Undangan digital</p>
        <h1>Daftar</h1>
        <p className="auth-card__lead">
          Buat akun untuk mengelola undangan (nama, foto, teks, tema).
        </p>

        {!isSupabaseConfigured && (
          <p className="auth-error">
            Supabase belum dikonfigurasi. Lihat <code>supabase/README.md</code>.
          </p>
        )}

        <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
          {error && <p className="auth-error">{error}</p>}
          <label className="auth-field">
            Nama
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? 'Membuat…' : 'Buat akun'}
          </button>
        </form>

        <p className="auth-foot">
          Sudah punya akun? <Link to="/login">Masuk</Link>
        </p>
      </div>
    </div>
  )
}
