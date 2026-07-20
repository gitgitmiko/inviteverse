import { useEffect, useState } from 'react'
import { useAuth } from '../components/AuthProvider'
import { THEME_LIST, type ThemeMeta } from '../lib/themeRegistry'
import {
  listPublishedThemes,
  listThemesForAdmin,
  type ThemePublishStatus,
} from '../lib/themeTemplates'

export type VisibleTheme = ThemeMeta & { status?: ThemePublishStatus }

/** User/tamu: published saja. Admin: semua. */
export function useVisibleThemes() {
  const user = useAuth()
  const isAdmin = user?.role === 'admin'
  const [themes, setThemes] = useState<VisibleTheme[]>(
    isAdmin ? THEME_LIST : [],
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        if (isAdmin) {
          const rows = await listThemesForAdmin()
          if (!cancelled) setThemes(rows)
        } else {
          const rows = await listPublishedThemes()
          if (!cancelled) setThemes(rows)
        }
      } catch {
        // Fallback aman: admin lihat semua; user lihat daftar code (dev)
        if (!cancelled) {
          setThemes(isAdmin ? THEME_LIST : THEME_LIST)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  return { themes, loading, isAdmin }
}
