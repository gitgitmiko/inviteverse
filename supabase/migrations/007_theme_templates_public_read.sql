-- Tamu (anon) boleh baca template yang sudah published
-- (katalog beranda + preview tanpa login). Draft tetap tersembunyi.
-- Jalankan di Supabase SQL Editor jika migrasi belum di-apply otomatis.

drop policy if exists "theme_templates_select_published" on public.theme_templates;
create policy "theme_templates_select_published"
  on public.theme_templates for select
  to anon
  using (status = 'published');
