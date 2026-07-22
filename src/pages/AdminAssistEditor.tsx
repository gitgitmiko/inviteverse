import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useInvitation } from '../components/InvitationProvider'
import Editor from './Editor'

/** Admin: buka undangan user dalam mode bantu edit konten */
export default function AdminAssistEditorPage() {
  const { invitationId } = useParams<{ invitationId: string }>()
  const [params] = useSearchParams()
  const requestId = params.get('request')
  const { selectInvitation, setContentAssist, loading, error } =
    useInvitation()
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    setContentAssist(true)
    return () => setContentAssist(false)
  }, [setContentAssist])

  useEffect(() => {
    if (!invitationId) return
    let cancelled = false
    setReady(false)
    setLoadError(null)
    void (async () => {
      try {
        await selectInvitation(invitationId)
        if (!cancelled) setReady(true)
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'Gagal memuat undangan',
          )
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [invitationId, selectInvitation])

  if (!invitationId) {
    return (
      <div className="ed" style={{ placeContent: 'center', minHeight: '100dvh' }}>
        <p style={{ textAlign: 'center' }}>
          Undangan tidak ditemukan.{' '}
          <Link to="/admin/assist">Kembali ke antrian</Link>
        </p>
      </div>
    )
  }

  if (loadError || error) {
    return (
      <div className="ed" style={{ placeContent: 'center', minHeight: '100dvh' }}>
        <p style={{ textAlign: 'center', color: '#7a2e28' }}>
          {loadError || error}
        </p>
        <p style={{ textAlign: 'center' }}>
          <Link to="/admin/assist">← Antrian bantuan</Link>
        </p>
      </div>
    )
  }

  if (!ready || loading) {
    return (
      <div className="ed" style={{ placeContent: 'center', minHeight: '100dvh' }}>
        <p style={{ textAlign: 'center', color: '#6b635a' }}>
          Memuat undangan untuk dibantu…
        </p>
      </div>
    )
  }

  return <Editor assistMode assistRequestId={requestId} />
}
