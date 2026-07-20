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
Di Dashboard → **SQL Editor**, jalankan isi file:
`supabase/migrations/001_init.sql`

## 4. Auth settings (untuk demo lokal)
Authentication → Providers → Email:
- Nonaktifkan **Confirm email** agar login langsung setelah daftar

## 5. Buat akun demo
Daftar lewat `/register`, lalu di SQL Editor (opsional admin):
```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@demo.com');
```

## 6. Jalankan app
```bash
npm run dev
```

Tanpa `.env`, UI tetap terbuka tapi login/save akan menampilkan error konfigurasi.
