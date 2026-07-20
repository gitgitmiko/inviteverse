import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { getSession, onAuthChanged, type AuthUser } from '../lib/authStore'
import { isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext<AuthUser | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let unsub: () => void = () => undefined

    void (async () => {
      if (!isSupabaseConfigured) {
        setUser(null)
        setReady(true)
        return
      }
      const session = await getSession()
      setUser(session)
      setReady(true)
      unsub = onAuthChanged(setUser)
    })()

    return () => {
      unsub()
    }
  }, [])

  if (!ready) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'Work Sans, system-ui, sans-serif',
          color: '#6b635a',
        }}
      >
        Memuat…
      </div>
    )
  }

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
