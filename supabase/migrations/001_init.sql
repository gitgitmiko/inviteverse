-- Fase 1: profiles, invitations, RLS, storage
-- Jalankan di Supabase SQL Editor atau: supabase db push

create extension if not exists "pgcrypto";

-- Profiles (1:1 dengan auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Undangan milik user
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null unique,
  title text not null default 'Undangan Baru',
  status text not null default 'draft' check (status in ('draft', 'published')),
  active_theme text not null default 'super-classic',
  content jsonb not null default '{}'::jsonb,
  theme_styles jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invitations_owner_id_idx on public.invitations (owner_id);
create index if not exists invitations_slug_idx on public.invitations (slug);
create index if not exists invitations_status_idx on public.invitations (status);

-- Auto profile saat user baru daftar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists invitations_updated_at on public.invitations;
create trigger invitations_updated_at
  before update on public.invitations
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.invitations enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "invitations_select_own" on public.invitations;
create policy "invitations_select_own"
  on public.invitations for select
  using (auth.uid() = owner_id);

drop policy if exists "invitations_select_published" on public.invitations;
create policy "invitations_select_published"
  on public.invitations for select
  using (status = 'published');

drop policy if exists "invitations_insert_own" on public.invitations;
create policy "invitations_insert_own"
  on public.invitations for insert
  with check (auth.uid() = owner_id);

drop policy if exists "invitations_update_own" on public.invitations;
create policy "invitations_update_own"
  on public.invitations for update
  using (auth.uid() = owner_id);

drop policy if exists "invitations_delete_own" on public.invitations;
create policy "invitations_delete_own"
  on public.invitations for delete
  using (auth.uid() = owner_id);

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('invitation-assets', 'invitation-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "assets_select_public" on storage.objects;
create policy "assets_select_public"
  on storage.objects for select
  using (bucket_id = 'invitation-assets');

drop policy if exists "assets_insert_own" on storage.objects;
create policy "assets_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'invitation-assets'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "assets_update_own" on storage.objects;
create policy "assets_update_own"
  on storage.objects for update
  using (
    bucket_id = 'invitation-assets'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "assets_delete_own" on storage.objects;
create policy "assets_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'invitation-assets'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
