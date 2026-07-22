import { requireSupabase } from './supabase'
import { getPlan, isPlanId, type PlanId } from './plans'

export type CreateInvoiceResult = {
  redirectUrl: string
  externalId: string
  amount: number
  planId: PlanId
}

export function isPlanSimulateEnabled() {
  return import.meta.env.VITE_ALLOW_PLAN_SIMULATE === 'true'
}

function explainFunctionsError(raw: string): string {
  const msg = raw.toLowerCase()
  if (
    msg.includes('failed to send a request to the edge function') ||
    msg.includes('not found') ||
    msg.includes('404') ||
    msg.includes('functionsrelayerror') ||
    msg.includes('failed to fetch')
  ) {
    return (
      'Edge Function Midtrans belum tersedia (belum di-deploy / belum dikonfigurasi). ' +
      'Untuk development, aktifkan VITE_ALLOW_PLAN_SIMULATE=true lalu gunakan “Aktifkan paket (uji)”. ' +
      'Produksi: deploy create-midtrans-snap — lihat supabase/MIDTRANS.md.'
    )
  }
  return raw
}

/** Mulai checkout Midtrans Snap untuk upgrade paket undangan */
export async function startPlanCheckout(
  invitationId: string,
  planId: PlanId,
): Promise<CreateInvoiceResult> {
  if (!isPlanId(planId) || planId === 'free') {
    throw new Error('Pilih paket berbayar')
  }
  const plan = getPlan(planId)
  const client = requireSupabase()

  try {
    const { data, error } = await client.functions.invoke(
      'create-midtrans-snap',
      {
        body: {
          invitationId,
          planId,
          amount: plan.priceIdr,
          planName: plan.name,
        },
      },
    )

    if (error) {
      throw new Error(explainFunctionsError(error.message || 'Gagal Edge Function'))
    }

    const payload = data as {
      error?: string
      redirect_url?: string
      external_id?: string
      amount?: number
      plan_id?: string
    }

    if (payload?.error) throw new Error(payload.error)
    if (!payload?.redirect_url) {
      throw new Error(
        'Redirect Midtrans tidak tersedia. Cek MIDTRANS_SERVER_KEY & deploy function.',
      )
    }

    return {
      redirectUrl: payload.redirect_url,
      externalId: payload.external_id ?? '',
      amount: payload.amount ?? plan.priceIdr,
      planId: (payload.plan_id as PlanId) ?? planId,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout gagal'
    throw new Error(explainFunctionsError(message))
  }
}

/** Upgrade paket langsung di DB (dev / sebelum Midtrans siap) */
export async function activatePlanLocally(
  invitationId: string,
  planId: PlanId,
): Promise<void> {
  if (!isPlanId(planId) || planId === 'free') {
    throw new Error('Pilih paket berbayar')
  }
  if (!isPlanSimulateEnabled()) {
    throw new Error(
      'Mode uji paket nonaktif. Tambahkan VITE_ALLOW_PLAN_SIMULATE=true di .env lalu restart npm run dev.',
    )
  }

  const client = requireSupabase()
  const { data, error } = await client
    .from('invitations')
    .update({
      plan_id: planId,
      plan_paid_at: new Date().toISOString(),
    })
    .eq('id', invitationId)
    .select('id, plan_id')
    .maybeSingle()

  if (error) {
    if (error.message.includes('plan_id') || error.code === 'PGRST204') {
      throw new Error(
        'Kolom plan_id belum ada. Jalankan SQL supabase/migrations/005_plans_payments.sql di Supabase.',
      )
    }
    throw error
  }
  if (!data) {
    throw new Error('Gagal mengaktifkan paket (undangan tidak ditemukan / RLS).')
  }
}
