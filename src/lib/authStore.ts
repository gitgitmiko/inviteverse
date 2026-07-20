import { requireSupabase, supabase, type ProfileRole } from './supabase'

export type UserRole = ProfileRole

export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
}

export async function getSession(): Promise<AuthUser | null> {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.user) return null
  return fetchAuthUser(data.session.user.id, data.session.user.email ?? '')
}

async function fetchAuthUser(
  id: string,
  email: string,
): Promise<AuthUser | null> {
  const client = requireSupabase()
  const { data: profile, error } = await client
    .from('profiles')
    .select('id, name, role')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error(error)
    return null
  }

  return {
    id,
    email,
    name: profile?.name || email.split('@')[0] || 'User',
    role: (profile?.role as UserRole) ?? 'user',
  }
}

export async function login(
  email: string,
  password: string,
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  try {
    const client = requireSupabase()
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error || !data.user) {
      return { ok: false, error: error?.message ?? 'Login gagal.' }
    }
    const user = await fetchAuthUser(data.user.id, data.user.email ?? email)
    if (!user) return { ok: false, error: 'Profil tidak ditemukan.' }
    return { ok: true, user }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Login gagal.',
    }
  }
}

export async function register(input: {
  name: string
  email: string
  password: string
}): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const password = input.password

  if (!name || !email || !password) {
    return { ok: false, error: 'Lengkapi nama, email, dan kata sandi.' }
  }
  if (password.length < 6) {
    return { ok: false, error: 'Kata sandi minimal 6 karakter.' }
  }

  try {
    const client = requireSupabase()
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { name, role: 'user' } },
    })
    if (error || !data.user) {
      return { ok: false, error: error?.message ?? 'Registrasi gagal.' }
    }

    // Pastikan nama ter-update di profiles
    await client.from('profiles').update({ name }).eq('id', data.user.id)

    const user = await fetchAuthUser(data.user.id, data.user.email ?? email)
    if (!user) {
      return {
        ok: false,
        error:
          'Akun dibuat. Jika email confirmation aktif, cek inbox lalu login.',
      }
    }
    return { ok: true, user }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Registrasi gagal.',
    }
  }
}

export async function logout() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export function onAuthChanged(cb: (user: AuthUser | null) => void) {
  if (!supabase) {
    cb(null)
    return () => undefined
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    void (async () => {
      if (!session?.user) {
        cb(null)
        return
      }
      const user = await fetchAuthUser(
        session.user.id,
        session.user.email ?? '',
      )
      cb(user)
    })()
  })

  return () => data.subscription.unsubscribe()
}

/** Petunjuk akun demo — buat manual di Supabase (lihat supabase/README.md) */
export const DEMO_ACCOUNTS = {
  admin: { email: 'admin@demo.com', password: 'admin123' },
  user: { email: 'user@demo.com', password: 'user123' },
} as const
