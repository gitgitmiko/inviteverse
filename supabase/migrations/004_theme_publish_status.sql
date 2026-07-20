-- Status template: draft | published
-- Jalankan setelah 003_theme_templates.sql

alter table public.theme_templates
  add column if not exists status text not null default 'draft';

-- Constraint (abaikan jika sudah ada)
do $$
begin
  alter table public.theme_templates
    add constraint theme_templates_status_check
    check (status in ('draft', 'published'));
exception
  when duplicate_object then null;
end $$;

-- Pastikan 3 tema bawaan ada & published (siap pakai untuk user)
insert into public.theme_templates (theme_id, styles, status)
values
  ('super-classic', '{}'::jsonb, 'published'),
  ('elegan-grey', '{}'::jsonb, 'published'),
  ('blue-flowers', '{}'::jsonb, 'published')
on conflict (theme_id) do nothing;

update public.theme_templates
set status = 'published'
where theme_id in ('super-classic', 'elegan-grey', 'blue-flowers');
