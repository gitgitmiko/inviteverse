// Webhook Midtrans: settlement → aktifkan plan undangan
// Deploy: supabase functions deploy midtrans-webhook --no-verify-jwt
// Notification URL di Midtrans Dashboard:
//   https://<project>.supabase.co/functions/v1/midtrans-webhook
// Secret: MIDTRANS_SERVER_KEY (untuk verifikasi signature)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')
    if (!serverKey) {
      return new Response(JSON.stringify({ error: 'MIDTRANS_SERVER_KEY missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const payload = await req.json()
    const orderId = String(payload.order_id || '')
    const statusCode = String(payload.status_code || '')
    const grossAmount = String(payload.gross_amount || '')
    const signatureKey = String(payload.signature_key || '')
    const transactionStatus = String(payload.transaction_status || '')
    const fraudStatus = String(payload.fraud_status || '')

    if (!orderId) {
      return new Response(JSON.stringify({ ok: true, skip: 'no order_id' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const expected = await sha512(
      `${orderId}${statusCode}${grossAmount}${serverKey}`,
    )
    if (signatureKey && signatureKey !== expected) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: payment } = await admin
      .from('payments')
      .select('*')
      .or(`external_id.eq.${orderId},midtrans_order_id.eq.${orderId}`)
      .maybeSingle()

    if (!payment) {
      return new Response(JSON.stringify({ ok: true, skip: 'payment not found' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const paid =
      transactionStatus === 'settlement' ||
      (transactionStatus === 'capture' &&
        (fraudStatus === 'accept' || !fraudStatus))

    if (paid) {
      await admin
        .from('payments')
        .update({
          status: 'paid',
          raw_webhook: payload,
          midtrans_order_id: orderId,
        })
        .eq('id', payment.id)

      await admin
        .from('invitations')
        .update({
          plan_id: payment.plan_id,
          plan_paid_at: new Date().toISOString(),
        })
        .eq('id', payment.invitation_id)
    } else if (transactionStatus === 'expire') {
      await admin
        .from('payments')
        .update({ status: 'expired', raw_webhook: payload })
        .eq('id', payment.id)
    } else if (
      transactionStatus === 'deny' ||
      transactionStatus === 'cancel' ||
      transactionStatus === 'failure'
    ) {
      await admin
        .from('payments')
        .update({ status: 'failed', raw_webhook: payload })
        .eq('id', payment.id)
    } else {
      await admin
        .from('payments')
        .update({ raw_webhook: payload })
        .eq('id', payment.id)
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})

async function sha512(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-512', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
