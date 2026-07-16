-- Nurse of the Month spotlight for the /nursing page.
create table if not exists public.nursing_spotlight (
  id uuid primary key default gen_random_uuid(),
  photo_url text,
  name text not null,
  specialty text,
  month_label_ar text,
  month_label_en text,
  message_ar text,
  message_en text,
  achievements_ar text,
  achievements_en text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_nursing_spotlight_updated_at before update on public.nursing_spotlight
  for each row execute function public.set_updated_at();

alter table public.nursing_spotlight enable row level security;

create policy "nursing_spotlight_public_read" on public.nursing_spotlight for select using (is_active);
create policy "nursing_spotlight_admin" on public.nursing_spotlight for all
  using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
  with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));
