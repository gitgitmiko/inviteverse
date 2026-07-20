-- Admin platform: bisa lihat & update semua undangan (edit tema),
-- tidak boleh insert/delete undangan.

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;

-- Select semua undangan (untuk daftar edit tema)
drop policy if exists "invitations_select_admin" on public.invitations;
create policy "invitations_select_admin"
  on public.invitations for select
  using (public.is_platform_admin());

-- Update tema (dan field lain) semua undangan
drop policy if exists "invitations_update_admin" on public.invitations;
create policy "invitations_update_admin"
  on public.invitations for update
  using (public.is_platform_admin());

-- User biasa saja yang boleh buat undangan
drop policy if exists "invitations_insert_own" on public.invitations;
create policy "invitations_insert_own"
  on public.invitations for insert
  with check (
    auth.uid() = owner_id
    and not public.is_platform_admin()
  );

-- Hapus hanya milik sendiri & bukan admin platform
drop policy if exists "invitations_delete_own" on public.invitations;
create policy "invitations_delete_own"
  on public.invitations for delete
  using (
    auth.uid() = owner_id
    and not public.is_platform_admin()
  );
