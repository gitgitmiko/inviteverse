# Pembayaran Midtrans Snap (paket satuan undangan)

## Alur
1. User pilih paket di `/harga` (undangan aktif harus ada).
2. Edge Function `create-midtrans-snap` membuat baris `payments` + token Snap.
3. User diarahkan ke halaman bayar Midtrans (VA / QRIS / e-wallet / kartu).
4. Webhook `midtrans-webhook` menerima `settlement` → set `invitations.plan_id`.
5. Editor menerapkan benefit sesuai paket.

## Setup
1. Jalankan SQL berurutan:
   - `005_plans_payments.sql`
   - `006_midtrans_payments.sql`
2. Buat akun di https://dashboard.midtrans.com (pakai **Sandbox** dulu).
3. Settings → Access Keys → salin **Server Key** (sandbox: `SB-Mid-server-...`).
4. Deploy functions:

```bash
supabase functions deploy create-midtrans-snap
supabase functions deploy midtrans-webhook --no-verify-jwt
```

5. Set secrets:

```bash
supabase secrets set MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
supabase secrets set APP_URL=http://localhost:5173
supabase secrets set MIDTRANS_IS_PRODUCTION=false
```

Untuk production nanti:
```bash
supabase secrets set MIDTRANS_SERVER_KEY=Mid-server-xxx
supabase secrets set MIDTRANS_IS_PRODUCTION=true
supabase secrets set APP_URL=https://domain-anda.com
```

6. Di Midtrans Dashboard → Settings → Configuration:
   - **Payment Notification URL:**
     `https://<PROJECT_REF>.supabase.co/functions/v1/midtrans-webhook`
   - **Finish Redirect URL** (opsional, sudah di-set dari API):
     `https://domain-anda.com/invitations?paid=1`

## Sandbox vs production
| Mode | Server Key | Snap host |
|------|------------|-----------|
| Sandbox | `SB-Mid-server-...` | app.sandbox.midtrans.com |
| Production | `Mid-server-...` | app.midtrans.com |

Kartu uji sandbox: lihat dokumentasi Midtrans (mis. `4811111111111114`).

## Dev tanpa Midtrans
Di `.env` frontend:
```
VITE_ALLOW_PLAN_SIMULATE=true
```
Tombol **Aktifkan (uji)** di `/harga` langsung meng-update `plan_id` undangan aktif.

## Paket (satuan, mengikuti Indoinvite)
| Paket | Harga | Ringkas |
|-------|-------|---------|
| Free | 0 | Uji coba, tanpa musik/foto/hadiah/galeri |
| Basic | 39.000 | Sebar undangan, tanpa musik/foto/hadiah |
| Klasik | 59.000 | Foto + musik + love story |
| Pro | 69.000 | + galeri 10 + titip hadiah |
| Super | 99.000 | + galeri 15 + auto scroll + streaming |
| Premium | 119.000 | + galeri 20 + custom musik + QR |
