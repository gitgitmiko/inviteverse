import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AppAccount from '../components/AppAccount'
import { useAuth } from '../components/AuthProvider'
import { useOptionalInvitation } from '../components/InvitationProvider'
import {
  formatIdr,
  PAID_PLAN_LIST,
  PLAN_LIST,
  type PlanId,
} from '../lib/plans'
import {
  activatePlanLocally,
  isPlanSimulateEnabled,
  startPlanCheckout,
} from '../lib/payments'
import './Pricing.css'

export default function PricingPage() {
  const user = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const inv = useOptionalInvitation()
  const highlight = (params.get('plan') as PlanId | null) ?? null

  const [busyPlan, setBusyPlan] = useState<PlanId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const currentPlan = inv?.activeRow?.plan_id ?? 'free'
  const allowSimulate = isPlanSimulateEnabled()

  const refreshActive = async () => {
    await inv?.refreshList()
    if (inv?.activeId) await inv.selectInvitation(inv.activeId)
  }

  const ensureCanUpgrade = (planId: PlanId) => {
    if (!user) {
      navigate('/login', { state: { from: `/harga?plan=${planId}` } })
      return false
    }
    if (user.role !== 'user') {
      setError('Upgrade paket hanya untuk akun user (pemilik undangan).')
      return false
    }
    if (!inv?.activeId) {
      setError(
        'Pilih/buat undangan dulu di Undanganku, lalu kembali ke halaman harga.',
      )
      navigate('/invitations')
      return false
    }
    return true
  }

  const onActivateLocal = async (planId: PlanId) => {
    setError(null)
    setMsg(null)
    if (!ensureCanUpgrade(planId) || planId === 'free' || !inv?.activeId) return

    setBusyPlan(planId)
    try {
      await activatePlanLocally(inv.activeId, planId)
      await refreshActive()
      setMsg(
        `Paket ${planId} aktif pada undangan “${inv.activeRow?.title ?? ''}”. (mode uji lokal)`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengaktifkan paket')
    } finally {
      setBusyPlan(null)
    }
  }

  const onCheckout = async (planId: PlanId) => {
    setError(null)
    setMsg(null)
    if (!ensureCanUpgrade(planId) || planId === 'free' || !inv?.activeId) return

    setBusyPlan(planId)
    try {
      const result = await startPlanCheckout(inv.activeId, planId)
      window.location.href = result.redirectUrl
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout gagal'
      // Dev: kalau Midtrans/EF belum siap, tawarkan aktifkan lokal
      if (allowSimulate) {
        const ok = window.confirm(
          `${message}\n\nEdge Function/Midtrans belum siap. Aktifkan paket “${planId}” secara lokal untuk testing sekarang?`,
        )
        if (ok) {
          try {
            await activatePlanLocally(inv.activeId, planId)
            await refreshActive()
            setMsg(`Paket ${planId} diaktifkan (uji lokal).`)
            setError(null)
            return
          } catch (simErr) {
            setError(
              simErr instanceof Error ? simErr.message : 'Gagal aktifkan lokal',
            )
            return
          }
        }
      }
      setError(message)
    } finally {
      setBusyPlan(null)
    }
  }

  const paidOnly = useMemo(() => PAID_PLAN_LIST, [])

  return (
    <div className="price">
      <header className="price__nav">
        <Link to="/" className="price__logo">
          Invite VERSE
        </Link>
        <div className="price__nav-actions">
          <nav className="price__nav-links" aria-label="Navigasi">
            <Link to="/" className="price__btn price__btn--ghost">
              Beranda
            </Link>
            {user?.role === 'user' && (
              <Link to="/invitations" className="price__btn price__btn--ghost">
                Undanganku
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/themes" className="price__btn price__btn--ghost">
                Template tema
              </Link>
            )}
          </nav>
          {user && <AppAccount user={user} />}
        </div>
      </header>

      <main className="price__main">
        <div className="price__head">
          <p className="price__eyebrow">Satuan · mengikuti model Indoinvite</p>
          <h1>Harga undangan digital</h1>
          <p>
            Pilih paket sekali bayar per undangan. Benefit langsung diterapkan ke
            undangan aktif Anda. Pembayaran produksi via{' '}
            <strong>Midtrans</strong>.
          </p>
          {allowSimulate && (
            <p className="price__dev">
              Mode uji aktif (<code>VITE_ALLOW_PLAN_SIMULATE</code>): bisa aktifkan
              paket tanpa Midtrans.
            </p>
          )}
          {inv?.activeRow && (
            <p className="price__current">
              Undangan aktif: <strong>{inv.activeRow.title}</strong> · paket{' '}
              <strong>{currentPlan}</strong>
            </p>
          )}
        </div>

        {(error || msg) && (
          <p className={`price__banner ${error ? 'is-error' : ''}`}>
            {error || msg}
          </p>
        )}

        <div className="price__grid">
          {PLAN_LIST.map((plan) => {
            const isCurrent = currentPlan === plan.id
            const isHighlight = highlight === plan.id || plan.popular
            return (
              <article
                key={plan.id}
                className={`price-card ${isHighlight ? 'is-popular' : ''} ${isCurrent ? 'is-current' : ''}`}
              >
                {plan.popular && (
                  <span className="price-card__tag">Populer</span>
                )}
                <h2>{plan.name}</h2>
                <p className="price-card__blurb">{plan.blurb}</p>
                <p className="price-card__price">{formatIdr(plan.priceIdr)}</p>
                <ul>
                  {plan.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
                {plan.id === 'free' ? (
                  <Link
                    to="/invitations"
                    className="price__btn price__btn--ghost"
                  >
                    Mulai gratis
                  </Link>
                ) : (
                  <div className="price-card__actions">
                    {allowSimulate ? (
                      <button
                        type="button"
                        className="price__btn price__btn--solid"
                        disabled={busyPlan === plan.id || isCurrent}
                        onClick={() => void onActivateLocal(plan.id)}
                      >
                        {isCurrent
                          ? 'Paket aktif'
                          : busyPlan === plan.id
                            ? 'Mengaktifkan…'
                            : `Aktifkan ${plan.name} (uji)`}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={`price__btn ${allowSimulate ? 'price__btn--ghost' : 'price__btn--solid'}`}
                      disabled={busyPlan === plan.id || isCurrent}
                      onClick={() => void onCheckout(plan.id)}
                    >
                      {isCurrent
                        ? 'Paket aktif'
                        : busyPlan === plan.id
                          ? 'Menyiapkan…'
                          : allowSimulate
                            ? `Bayar Midtrans (${plan.name})`
                            : `Pilih ${plan.name}`}
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>

        <section className="price__note">
          <h3>Catatan</h3>
          <ul>
            <li>
              Harga satuan mengacu pada{' '}
              <a
                href="https://indoinvite.com/harga"
                target="_blank"
                rel="noreferrer"
              >
                Indoinvite
              </a>
              .
            </li>
            <li>
              Error “Failed to send a request to the Edge Function” = function
              Midtrans belum di-deploy. Lihat <code>supabase/MIDTRANS.md</code>.
            </li>
            <li>Paket berbayar: {paidOnly.map((p) => p.name).join(', ')}.</li>
          </ul>
        </section>
      </main>
    </div>
  )
}
