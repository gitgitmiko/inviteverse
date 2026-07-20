-- Kolom Midtrans pada payments (setelah 005)
-- Kolom xendit_* dibiarkan nullable untuk kompatibilitas baris lama

alter table public.payments
  add column if not exists midtrans_order_id text;

alter table public.payments
  add column if not exists midtrans_snap_token text;

alter table public.payments
  add column if not exists midtrans_redirect_url text;

create index if not exists payments_midtrans_order_id_idx
  on public.payments (midtrans_order_id);
