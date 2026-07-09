-- Expands the initial schema with the remaining content-management tables:
-- generic pages, homepage/navigation structure, quick links, doctors,
-- clinics, and events. Reuses public.set_updated_at() and
-- public.has_admin_role() from 20260709120000_initial_schema.sql.

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_ar text not null,
  title_en text not null,
  excerpt_ar text,
  excerpt_en text,
  content_ar text,
  content_en text,
  seo_title_ar text,
  seo_title_en text,
  seo_description_ar text,
  seo_description_en text,
  og_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 100,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  section_key text not null,
  title_ar text,
  title_en text,
  body_ar text,
  body_en text,
  media_url text,
  content jsonb not null default '{}'::jsonb,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  label_ar text not null,
  label_en text not null,
  path text,
  url text,
  icon text,
  location text not null default 'header' check (location in ('header', 'footer', 'quick')),
  parent_id uuid references public.navigation_items(id) on delete cascade,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  title_ar text,
  title_en text,
  subtitle_ar text,
  subtitle_en text,
  content jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quick_links (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  description_ar text,
  description_en text,
  icon text default 'ExternalLink',
  path text,
  url text,
  audience text not null default 'public' check (audience in ('public', 'employee', 'admin', 'all')),
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  full_name_ar text not null,
  full_name_en text not null,
  title_ar text,
  title_en text,
  specialty_ar text,
  specialty_en text,
  department_id uuid references public.departments(id) on delete set null,
  bio_ar text,
  bio_en text,
  photo_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 100,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinics (like public.services including all);
create table if not exists public.events (like public.services including all);

alter table public.events add column if not exists start_at timestamptz;
alter table public.events add column if not exists end_at timestamptz;
alter table public.events add column if not exists location_ar text;
alter table public.events add column if not exists location_en text;

create trigger set_pages_updated_at
before update on public.pages
for each row execute function public.set_updated_at();

create trigger set_page_sections_updated_at
before update on public.page_sections
for each row execute function public.set_updated_at();

create trigger set_navigation_items_updated_at
before update on public.navigation_items
for each row execute function public.set_updated_at();

create trigger set_homepage_sections_updated_at
before update on public.homepage_sections
for each row execute function public.set_updated_at();

create trigger set_quick_links_updated_at
before update on public.quick_links
for each row execute function public.set_updated_at();

create trigger set_doctors_updated_at
before update on public.doctors
for each row execute function public.set_updated_at();

create trigger set_clinics_updated_at
before update on public.clinics
for each row execute function public.set_updated_at();

create trigger set_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

alter table public.pages enable row level security;
alter table public.page_sections enable row level security;
alter table public.navigation_items enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.quick_links enable row level security;
alter table public.doctors enable row level security;
alter table public.clinics enable row level security;
alter table public.events enable row level security;

create policy "pages_public_read"
on public.pages for select
using (status = 'published');

create policy "pages_admin_manage"
on public.pages for all
using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

create policy "page_sections_public_read"
on public.page_sections for select
using (
  is_active = true
  and exists (
    select 1 from public.pages p
    where p.id = page_sections.page_id and p.status = 'published'
  )
);

create policy "page_sections_admin_manage"
on public.page_sections for all
using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

create policy "navigation_items_public_read"
on public.navigation_items for select
using (is_active = true);

create policy "navigation_items_admin_manage"
on public.navigation_items for all
using (public.has_admin_role(array['super_admin', 'admin']))
with check (public.has_admin_role(array['super_admin', 'admin']));

create policy "homepage_sections_public_read"
on public.homepage_sections for select
using (is_active = true);

create policy "homepage_sections_admin_manage"
on public.homepage_sections for all
using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

create policy "quick_links_public_read"
on public.quick_links for select
using (is_active = true);

create policy "quick_links_admin_manage"
on public.quick_links for all
using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

create policy "doctors_public_read"
on public.doctors for select
using (status = 'published');

create policy "doctors_admin_manage"
on public.doctors for all
using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

create policy "clinics_public_read"
on public.clinics for select
using (status = 'published' and visibility = 'public');

create policy "clinics_admin_manage"
on public.clinics for all
using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

create policy "events_public_read"
on public.events for select
using (status = 'published' and visibility = 'public');

create policy "events_admin_manage"
on public.events for all
using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));
