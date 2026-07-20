import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import ThemePreview from '../components/ThemePreview'
import { resolveGuestNameFromSearch } from '../lib/guestInvite'
import {
  getInvitationBySlug,
  rowToInvitationData,
  type InvitationData,
} from '../lib/invitationStore'
import { getPlan } from '../lib/plans'
import { isSupabaseConfigured } from '../lib/supabase'

export default function PublicInvitation() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
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
        const plan = getPlan(row.plan_id)
        const next = rowToInvitationData(row)
        if (!plan.benefits.music) next.musicUrl = ''
        if (!plan.benefits.gift) {
          next.gift = { ...next.gift, accounts: [], intro: '' }
        }
        if (!plan.benefits.loveStory) {
          next.story = { ...next.story, items: [] }
        }
        if (!plan.benefits.couplePhotos) {
          next.groom = { ...next.groom, photo: '' }
          next.bride = { ...next.bride, photo: '' }
          next.coverPhoto = ''
        }
        next.gallery = next.gallery.slice(0, plan.benefits.galleryMax)
        setData(next)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat undangan')
        setData(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [slug])

  const personalized = useMemo(() => {
    if (!data) return null
    const guestName = resolveGuestNameFromSearch(searchParams, data.guestName)
    return { ...data, guestName }
  }, [data, searchParams])

  if (loading) {
    return (
      <div className="pub-state">
        <p>Memuat undangan…</p>
      </div>
    )
  }

  if (error || !personalized) {
    return (
      <div className="pub-state">
        <p>{error ?? 'Tidak ditemukan'}</p>
        <Link to="/">← Beranda</Link>
      </div>
    )
  }

  return <ThemePreview data={personalized} />
}
