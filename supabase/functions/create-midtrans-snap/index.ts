// Supabase Edge Function: buat transaksi Snap Midtrans untuk upgrade paket
// Deploy: supabase functions deploy create-midtrans-snap
// Secrets:
//   supabase secrets set MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
//   supabase secrets set APP_URL=http://localhost:5173
//   supabase secrets set MIDTRANS_IS_PRODUCTION=false

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173'
    const isProd =
      Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true' ||
      Deno.env.get('MIDTRANS_IS_PRODUCTION') === '1'

    if (!serverKey) {
      return json({ error: 'MIDTRANS_SERVER_KEY belum diset' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser()
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401)

    const body = await req.json()
    const invitationId = String(body.invitationId || '')
    const planId = String(body.planId || '')
    const amount = Number(body.amount || 0)
    const planName = String(body.planName || planId)

    if (!invitationId || !planId || amount <= 0) {
      return json({ error: 'invitationId, planId, amount wajib' }, 400)
    }

    const admin = createClient(supabaseUrl, serviceKey)

    const { data: inv, error: invErr } = await admin
      .from('invitations')
      .select('id, owner_id, title, slug')
      .eq('id', invitationId)
      .single()

    if (invErr || !inv || inv.owner_id !== user.id) {
      return json({ error: 'Undangan tidak ditemukan' }, 404)
    }

    const orderId = `inviteverse-${invitationId.slice(0, 8)}-${planId}-${Date.now()}`

    const { data: payment, error: payErr } = await admin
      .from('payments')
      .insert({
        invitation_id: invitationId,
        owner_id: user.id,
        plan_id: planId,
        amount_idr: amount,
        status: 'pending',
        external_id: orderId,
        midtrans_order_id: orderId,
      })
      .select('id')
      .single()

    if (payErr) {
      return json({ error: payErr.message }, 500)
    }

    const snapHost = isProd
      ? 'https://app.midtrans.com'
      : 'https://app.sandbox.midtrans.com'
    const auth = btoa(`${serverKey}:`)

    const snapRes = await fetch(`${snapHost}/snap/v1/transactions`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
        item_details: [
          {
            id: planId,
            price: amount,
            quantity: 1,
            name: `Invite VERSE ${planName}`.slice(0, 50),
          },
        ],
        customer_details: {
          email: user.email ?? undefined,
        },
        callbacks: {
          finish: `${appUrl}/invitations?paid=1`,
          error: `${appUrl}/harga?failed=1`,
        },
      }),
    })

    const snap = await snapRes.json()
    if (!snapRes.ok || !snap.token || !snap.redirect_url) {
      await admin
        .from('payments')
        .update({ status: 'failed', raw_webhook: snap })
        .eq('id', payment.id)
      return json(
        {
          error:
            snap.error_messages?.join?.(', ') ||
            snap.message ||
            'Midtrans menolak transaksi',
        },
        502,
      )
    }

    await admin
      .from('payments')
      .update({
        midtrans_snap_token: snap.token,
        midtrans_redirect_url: snap.redirect_url,
      })
      .eq('id', payment.id)

    return json({
      redirect_url: snap.redirect_url,
      snap_token: snap.token,
      external_id: orderId,
      amount,
      plan_id: planId,
    })
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : 'Server error' },
      500,
    )
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
