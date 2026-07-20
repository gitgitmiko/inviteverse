import { useNavigate } from 'react-router-dom'
import { logout, type AuthUser } from '../lib/authStore'
import './appAccount.css'

type Props = {
  user: Pick<AuthUser, 'name' | 'role'>
  /** light: halaman terang · dark: editor */
  tone?: 'light' | 'dark'
  className?: string
}

export function userInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

/** Chip akun + tombol Keluar — seragam di beranda, admin, user, editor */
export default function AppAccount({
  user,
  tone = 'light',
  className = '',
}: Props) {
  const navigate = useNavigate()

  return (
    <div
      className={`app-account app-account--${tone} ${className}`.trim()}
    >
      <div className="app-account__meta">
        <span className="app-account__avatar" aria-hidden>
          {userInitials(user.name)}
        </span>
        <span className="app-account__text">
          <span className="app-account__name">{user.name}</span>
          <span className="app-account__role">
            {user.role === 'admin' ? 'Admin' : 'Pengguna'}
          </span>
        </span>
      </div>
      <button
        type="button"
        className="app-account__logout"
        onClick={() => {
          void logout().then(() => navigate('/'))
        }}
      >
        Keluar
      </button>
    </div>
  )
}
