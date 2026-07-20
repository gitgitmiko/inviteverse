-- Paket satuan undangan + riwayat pembayaran
-- Jalankan setelah 004 (lanjutan Midtrans: 006_midtrans_payments.sql)

alter table public.invitations
  add column if not exists plan_id text not null default 'free';

alter table public.invitations
  add column if not exists plan_paid_at timestamptz;

do $$
begin
  alter table public.invitations
    add constraint invitations_plan_id_check
    check (plan_id in ('free', 'basic', 'klasik', 'pro', 'super', 'premium'));
exception
  when duplicate_object then null;
end $$;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  plan_id text not null,
  amount_idr integer not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'expired', 'failed')),
  xendit_invoice_id text,
  xendit_invoice_url text,
  external_id text not null unique,
  raw_webhook jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_invitation_id_idx on public.payments (invitation_id);
create index if not exists payments_owner_id_idx on public.payments (owner_id);
create index if not exists payments_external_id_idx on public.payments (external_id);

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
  on public.payments for select
  using (auth.uid() = owner_id);

-- Insert/update payments dilakukan lewat Edge Function (service role)
drop policy if exists "payments_insert_own" on public.payments;
create policy "payments_insert_own"
  on public.payments for insert
  with check (auth.uid() = owner_id);
