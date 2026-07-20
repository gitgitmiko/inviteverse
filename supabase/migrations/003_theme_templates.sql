-- Template tema global (admin edit ornamen/visual; user dapat salinan saat buat undangan)
-- Jalankan setelah 001_init.sql dan 002_admin_theme_only.sql

create table if not exists public.theme_templates (
  theme_id text primary key,
  styles jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists theme_templates_updated_at on public.theme_templates;
create trigger theme_templates_updated_at
  before update on public.theme_templates
  for each row execute function public.set_updated_at();

alter table public.theme_templates enable row level security;

-- Semua user login boleh baca (untuk seed undangan baru)
drop policy if exists "theme_templates_select_auth" on public.theme_templates;
create policy "theme_templates_select_auth"
  on public.theme_templates for select
  to authenticated
  using (true);

-- Hanya admin platform yang menulis
drop policy if exists "theme_templates_insert_admin" on public.theme_templates;
create policy "theme_templates_insert_admin"
  on public.theme_templates for insert
  with check (public.is_platform_admin());

drop policy if exists "theme_templates_update_admin" on public.theme_templates;
create policy "theme_templates_update_admin"
  on public.theme_templates for update
  using (public.is_platform_admin());

drop policy if exists "theme_templates_delete_admin" on public.theme_templates;
create policy "theme_templates_delete_admin"
  on public.theme_templates for delete
  using (public.is_platform_admin());

-- Storage: path themes/{theme_id}/... hanya admin
drop policy if exists "assets_insert_themes_admin" on storage.objects;
create policy "assets_insert_themes_admin"
  on storage.objects for insert
  with check (
    bucket_id = 'invitation-assets'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = 'themes'
    and public.is_platform_admin()
  );

drop policy if exists "assets_update_themes_admin" on storage.objects;
create policy "assets_update_themes_admin"
  on storage.objects for update
  using (
    bucket_id = 'invitation-assets'
    and (storage.foldername(name))[1] = 'themes'
    and public.is_platform_admin()
  );

drop policy if exists "assets_delete_themes_admin" on storage.objects;
create policy "assets_delete_themes_admin"
  on storage.objects for delete
  using (
    bucket_id = 'invitation-assets'
    and (storage.foldername(name))[1] = 'themes'
    and public.is_platform_admin()
  );
