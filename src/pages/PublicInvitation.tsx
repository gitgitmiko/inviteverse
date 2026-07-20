import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ThemePreview from '../components/ThemePreview'
import {
  getInvitationBySlug,
  rowToInvitationData,
  type InvitationData,
} from '../lib/invitationStore'
import { isSupabaseConfigured } from '../lib/supabase'

export default function PublicInvitation() {
  const { slug } = useParams<{ slug: string }>()
  const [data, setData] = useState<InvitationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) {
      setError('Slug tidak valid')
      setLoading(false)
      return
    }
    if (!isSupabaseConfigured) {
      setError('Supabase belum dikonfigurasi')
      setLoading(false)
      return
    }

    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const row = await getInvitationBySlug(slug)
        if (!row) {
          setError('Undangan tidak ditemukan atau belum dipublikasikan.')
          setData(null)
          return
        }
        setData(rowToInvitationData(row))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat undangan')
        setData(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [slug])

  if (loading) {
    return (
      <div className="pub-state">
        <p>Memuat undangan…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="pub-state">
        <p>{error ?? 'Tidak ditemukan'}</p>
        <Link to="/">← Beranda</Link>
      </div>
    )
  }

  return <ThemePreview data={data} />
}
