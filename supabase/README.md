# Setup migrasi Supabase (Fase 1)

## 1. Buat project
1. Buka https://supabase.com → New project
2. Salin **Project URL** dan **anon public** key

## 2. Env lokal
```bash
cp .env.example .env
```
Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.

## 3. Jalankan SQL
Di Dashboard → **SQL Editor**, jalankan berurutan:
1. `supabase/migrations/001_init.sql`
2. `supabase/migrations/002_admin_theme_only.sql`
3. `supabase/migrations/003_theme_templates.sql` (template tema global + storage ornamen)
4. `supabase/migrations/004_theme_publish_status.sql` (draft vs published)
5. `supabase/migrations/005_plans_payments.sql` (paket + payments)
6. `supabase/migrations/006_midtrans_payments.sql` (kolom Midtrans)
7. `supabase/migrations/007_theme_templates_public_read.sql` (tamu boleh baca tema published)
8. `supabase/migrations/008_assist_requests.sql` (antrian Dibuatin Admin)

Lihat juga `supabase/MIDTRANS.md` untuk setup pembayaran.

## 4. Auth settings (untuk demo lokal)
Authentication → Providers → Email:
- Nonaktifkan **Confirm email** agar login langsung setelah daftar

## 5. Buat akun demo
Daftar lewat `/register` sebagai **user** (pembuat undangan).

Akun admin (setelah daftar):
```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@demo.com');
```

Peran:
- **user** / tamu — hanya melihat tema **published** (siap pakai)
- **admin** — melihat **draft + published**; edit template; tombol Publish / Jadikan draft di `/themes`

Undangan baru menyalin `theme_styles` dari template admin (plus default code).

## 6. Jalankan app
```bash
npm run dev
```

Tanpa `.env`, UI tetap terbuka tapi login/save akan menampilkan error konfigurasi.
