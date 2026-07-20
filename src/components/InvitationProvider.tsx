import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthProvider'
import {
  createInvitation,
  deleteInvitation,
  getActiveInvitationId,
  getDefaultInvitation,
  getInvitationById,
  listAccessibleInvitations,
  rowToInvitationData,
  saveInvitationRemote,
  saveInvitationThemeRemote,
  setActiveInvitationId,
  setInvitationStatus,
  type InvitationData,
} from '../lib/invitationStore'
import type { InvitationRow } from '../lib/supabase'
import { isSupabaseConfigured } from '../lib/supabase'
import { getPlan, type PlanBenefits, type PlanDef } from '../lib/plans'
import type { ThemeId } from '../lib/themeTypes'

type InvitationContextValue = {
  list: InvitationRow[]
  activeId: string | null
  activeRow: InvitationRow | null
  data: InvitationData
  loading: boolean
  saving: boolean
  error: string | null
  plan: PlanDef
  benefits: PlanBenefits
  refreshList: () => Promise<void>
  selectInvitation: (id: string) => Promise<void>
  createNew: (themeId?: ThemeId) => Promise<InvitationRow>
  updateData: (next: InvitationData | ((prev: InvitationData) => InvitationData)) => void
  save: () => Promise<void>
  publish: () => Promise<void>
  unpublish: () => Promise<void>
  importLocalData: (local: InvitationData) => Promise<InvitationRow>
  remove: (id: string) => Promise<void>
}

const InvitationContext = createContext<InvitationContextValue | null>(null)

export function InvitationProvider({ children }: { children: ReactNode }) {
  const user = useAuth()
  const [list, setList] = useState<InvitationRow[]>([])
  const [activeId, setActiveId] = useState<string | null>(() =>
    getActiveInvitationId(),
  )
  const [activeRow, setActiveRow] = useState<InvitationRow | null>(null)
  const [data, setData] = useState<InvitationData>(() => getDefaultInvitation())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshList = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setList([])
      return
    }
    const rows = await listAccessibleInvitations(user.role)
    setList(rows)
  }, [user])

  const selectInvitation = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const row = await getInvitationById(id)
      setActiveRow(row)
      setActiveId(row.id)
      setActiveInvitationId(row.id)
      setData(rowToInvitationData(row))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat undangan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setList([])
      setActiveRow(null)
      setData(getDefaultInvitation())
      return
    }

    void (async () => {
      setLoading(true)
      try {
        const rows = await listAccessibleInvitations(user.role)
        setList(rows)
        const preferred =
          rows.find((r) => r.id === getActiveInvitationId()) ?? rows[0]
        if (preferred) {
          setActiveRow(preferred)
          setActiveId(preferred.id)
          setActiveInvitationId(preferred.id)
          setData(rowToInvitationData(preferred))
        } else {
          setActiveRow(null)
          setActiveId(null)
          setData(getDefaultInvitation())
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat daftar')
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  const createNew = useCallback(
    async (themeId?: ThemeId) => {
      if (user?.role === 'admin') {
        throw new Error(
          'Akun admin tidak dapat membuat undangan. Admin hanya mengedit tema.',
        )
      }
      const row = await createInvitation({ themeId })
      await refreshList()
      setActiveRow(row)
      setActiveId(row.id)
      setData(rowToInvitationData(row))
      return row
    },
    [refreshList, user?.role],
  )

  const updateData = useCallback(
    (next: InvitationData | ((prev: InvitationData) => InvitationData)) => {
      setData((prev) => (typeof next === 'function' ? next(prev) : next))
    },
    [],
  )

  const save = useCallback(async () => {
    if (!activeId) throw new Error('Belum ada undangan aktif')
    setSaving(true)
    setError(null)
    try {
      const row =
        user?.role === 'admin'
          ? await saveInvitationThemeRemote(activeId, data)
          : await saveInvitationRemote(activeId, data, {
              title: `${data.groomNickname} & ${data.brideNickname}`,
            })
      setActiveRow(row)
      await refreshList()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan'
      setError(msg)
      throw err
    } finally {
      setSaving(false)
    }
  }, [activeId, data, refreshList, user?.role])

  const publish = useCallback(async () => {
    if (user?.role === 'admin') {
      throw new Error('Admin tidak mempublikasikan undangan')
    }
    if (!activeId) throw new Error('Belum ada undangan aktif')
    const currentPlan = getPlan(activeRow?.plan_id ?? 'free')
    if (!currentPlan.benefits.publish) {
      throw new Error(
        `Paket ${currentPlan.name} tidak bisa publish. Upgrade di halaman Harga untuk menyebar undangan.`,
      )
    }
    await save()
    const row = await setInvitationStatus(activeId, 'published')
    setActiveRow(row)
    await refreshList()
  }, [activeId, activeRow?.plan_id, refreshList, save, user?.role])

  const unpublish = useCallback(async () => {
    if (user?.role === 'admin') {
      throw new Error('Admin tidak mengubah status publish')
    }
    if (!activeId) throw new Error('Belum ada undangan aktif')
    const row = await setInvitationStatus(activeId, 'draft')
    setActiveRow(row)
    await refreshList()
  }, [activeId, refreshList, user?.role])

  const importLocalData = useCallback(
    async (local: InvitationData) => {
      if (user?.role === 'admin') {
        throw new Error('Admin tidak dapat mengimpor undangan')
      }
      const row = await createInvitation({
        fromData: local,
        themeId: local.activeTheme,
        title: `${local.groomNickname} & ${local.brideNickname}`,
      })
      await refreshList()
      setActiveRow(row)
      setActiveId(row.id)
      setData(rowToInvitationData(row))
      return row
    },
    [refreshList, user?.role],
  )

  const remove = useCallback(
    async (id: string) => {
      if (user?.role === 'admin') {
        throw new Error('Admin tidak dapat menghapus undangan')
      }
      await deleteInvitation(id)
      const rows = await listAccessibleInvitations(user?.role ?? 'user')
      setList(rows)
      if (activeId === id) {
        const next = rows[0] ?? null
        if (next) {
          setActiveRow(next)
          setActiveId(next.id)
          setActiveInvitationId(next.id)
          setData(rowToInvitationData(next))
        } else {
          setActiveRow(null)
          setActiveId(null)
          setActiveInvitationId(null)
          setData(getDefaultInvitation())
        }
      }
    },
    [activeId, user?.role],
  )

  const plan = useMemo(
    () => getPlan(activeRow?.plan_id ?? 'free'),
    [activeRow?.plan_id],
  )
  const benefits = plan.benefits

  const value = useMemo(
    () => ({
      list,
      activeId,
      activeRow,
      data,
      loading,
      saving,
      error,
      plan,
      benefits,
      refreshList,
      selectInvitation,
      createNew,
      updateData,
      save,
      publish,
      unpublish,
      importLocalData,
      remove,
    }),
    [
      list,
      activeId,
      activeRow,
      data,
      loading,
      saving,
      error,
      plan,
      benefits,
      refreshList,
      selectInvitation,
      createNew,
      updateData,
      save,
      publish,
      unpublish,
      importLocalData,
      remove,
    ],
  )

  return (
    <InvitationContext.Provider value={value}>
      {children}
    </InvitationContext.Provider>
  )
}

export function useInvitation() {
  const ctx = useContext(InvitationContext)
  if (!ctx) {
    throw new Error('useInvitation harus di dalam InvitationProvider')
  }
  return ctx
}

export function useOptionalInvitation() {
  return useContext(InvitationContext)
}
