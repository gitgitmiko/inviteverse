-- Antrian “Dibuatin Admin”: user minta bantuan edit konten undangan.

create table if not exists public.assist_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  theme_id text not null,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'done', 'cancelled')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assist_requests_status_created_idx
  on public.assist_requests (status, created_at desc);

create index if not exists assist_requests_owner_id_idx
  on public.assist_requests (owner_id);

create index if not exists assist_requests_invitation_id_idx
  on public.assist_requests (invitation_id);

drop trigger if exists assist_requests_updated_at on public.assist_requests;
create trigger assist_requests_updated_at
  before update on public.assist_requests
  for each row execute function public.set_updated_at();

alter table public.assist_requests enable row level security;

-- User: lihat & buat request miliknya
drop policy if exists "assist_requests_select_own" on public.assist_requests;
create policy "assist_requests_select_own"
  on public.assist_requests for select
  using (auth.uid() = owner_id);

drop policy if exists "assist_requests_insert_own" on public.assist_requests;
create policy "assist_requests_insert_own"
  on public.assist_requests for insert
  with check (
    auth.uid() = owner_id
    and not public.is_platform_admin()
  );

-- User hanya boleh batalkan request sendiri
drop policy if exists "assist_requests_update_own_cancel" on public.assist_requests;
create policy "assist_requests_update_own_cancel"
  on public.assist_requests for update
  using (auth.uid() = owner_id and not public.is_platform_admin())
  with check (
    auth.uid() = owner_id
    and status = 'cancelled'
  );

-- Admin: lihat & ubah semua status
drop policy if exists "assist_requests_select_admin" on public.assist_requests;
create policy "assist_requests_select_admin"
  on public.assist_requests for select
  using (public.is_platform_admin());

drop policy if exists "assist_requests_update_admin" on public.assist_requests;
create policy "assist_requests_update_admin"
  on public.assist_requests for update
  using (public.is_platform_admin());

-- Admin perlu nama user di antrian
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_platform_admin());
