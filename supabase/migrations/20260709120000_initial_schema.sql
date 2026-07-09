create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'viewer'
    check (role in ('super_admin', 'admin', 'editor', 'reviewer', 'viewer')),
  status text not null default 'active'
    check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'viewer',
    'active'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

create or replace function public.has_admin_role(allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and p.role = any(allowed_roles)
  );
$$;

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_ar text not null,
  title_en text not null,
  description_ar text,
  description_en text,
  category_ar text,
  category_en text,
  icon text default 'FileText',
  path text,
  url text,
  visibility text not null default 'public' check (visibility in ('public', 'employees', 'admin')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.departments (like public.services including all);
create table if not exists public.news_posts (like public.services including all);
create table if not exists public.knowledge_items (like public.services including all);
create table if not exists public.important_links (like public.services including all);
create table if not exists public.initiatives (like public.services including all);
create table if not exists public.faqs (like public.services including all);

create table if not exists public.file_assets (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  bucket text not null,
  object_path text not null,
  file_type text,
  visibility text not null default 'employees' check (visibility in ('public', 'employees', 'admin')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  category text,
  subject text,
  message text,
  department text,
  priority text,
  location text,
  status text not null default 'new' check (status in ('new', 'in_review', 'closed', 'archived')),
  assigned_to uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.experience_feedback (like public.contact_messages including all);
create table if not exists public.initiative_submissions (like public.contact_messages including all);
create table if not exists public.good_catch_reports (like public.contact_messages including all);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  entity_table text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

create trigger set_services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create trigger set_departments_updated_at
before update on public.departments
for each row execute function public.set_updated_at();

create trigger set_news_posts_updated_at
before update on public.news_posts
for each row execute function public.set_updated_at();

create trigger set_knowledge_items_updated_at
before update on public.knowledge_items
for each row execute function public.set_updated_at();

create trigger set_important_links_updated_at
before update on public.important_links
for each row execute function public.set_updated_at();

create trigger set_initiatives_updated_at
before update on public.initiatives
for each row execute function public.set_updated_at();

create trigger set_faqs_updated_at
before update on public.faqs
for each row execute function public.set_updated_at();

create trigger set_file_assets_updated_at
before update on public.file_assets
for each row execute function public.set_updated_at();

create trigger set_contact_messages_updated_at
before update on public.contact_messages
for each row execute function public.set_updated_at();

create trigger set_experience_feedback_updated_at
before update on public.experience_feedback
for each row execute function public.set_updated_at();

create trigger set_initiative_submissions_updated_at
before update on public.initiative_submissions
for each row execute function public.set_updated_at();

create trigger set_good_catch_reports_updated_at
before update on public.good_catch_reports
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.services enable row level security;
alter table public.departments enable row level security;
alter table public.news_posts enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.important_links enable row level security;
alter table public.initiatives enable row level security;
alter table public.faqs enable row level security;
alter table public.file_assets enable row level security;
alter table public.contact_messages enable row level security;
alter table public.experience_feedback enable row level security;
alter table public.initiative_submissions enable row level security;
alter table public.good_catch_reports enable row level security;
alter table public.activity_logs enable row level security;

create policy "profiles_read_own"
on public.profiles for select
using (id = auth.uid());

create policy "profiles_admin_read"
on public.profiles for select
using (public.has_admin_role(array['super_admin', 'admin']));

create policy "profiles_super_admin_manage"
on public.profiles for all
using (public.has_admin_role(array['super_admin']))
with check (public.has_admin_role(array['super_admin']));

create policy "site_settings_public_read"
on public.site_settings for select
using (is_public = true);

create policy "site_settings_admin_manage"
on public.site_settings for all
using (public.has_admin_role(array['super_admin', 'admin']))
with check (public.has_admin_role(array['super_admin', 'admin']));

create policy "file_assets_public_read"
on public.file_assets for select
using (status = 'published' and visibility = 'public');

create policy "file_assets_admin_manage"
on public.file_assets for all
using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

create policy "activity_logs_admin_read"
on public.activity_logs for select
using (public.has_admin_role(array['super_admin', 'admin']));

create policy "activity_logs_admin_insert"
on public.activity_logs for insert
with check (public.has_admin_role(array['super_admin', 'admin', 'editor', 'reviewer']));

create policy "contact_messages_public_insert"
on public.contact_messages for insert
with check (true);

create policy "experience_feedback_public_insert"
on public.experience_feedback for insert
with check (true);

create policy "initiative_submissions_public_insert"
on public.initiative_submissions for insert
with check (true);

create policy "good_catch_reports_public_insert"
on public.good_catch_reports for insert
with check (true);

create policy "contact_messages_admin_manage"
on public.contact_messages for all
using (public.has_admin_role(array['super_admin', 'admin', 'reviewer']))
with check (public.has_admin_role(array['super_admin', 'admin', 'reviewer']));

create policy "experience_feedback_admin_manage"
on public.experience_feedback for all
using (public.has_admin_role(array['super_admin', 'admin', 'reviewer']))
with check (public.has_admin_role(array['super_admin', 'admin', 'reviewer']));

create policy "initiative_submissions_admin_manage"
on public.initiative_submissions for all
using (public.has_admin_role(array['super_admin', 'admin', 'reviewer']))
with check (public.has_admin_role(array['super_admin', 'admin', 'reviewer']));

create policy "good_catch_reports_admin_manage"
on public.good_catch_reports for all
using (public.has_admin_role(array['super_admin', 'admin', 'reviewer']))
with check (public.has_admin_role(array['super_admin', 'admin', 'reviewer']));

create policy "services_public_read"
on public.services for select
using (status = 'published' and visibility = 'public');

create policy "services_admin_manage"
on public.services for all
using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

create policy "departments_public_read"
on public.departments for select
using (status = 'published' and visibility = 'public');

create policy "departments_admin_manage"
on public.departments for all
using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

create policy "news_posts_public_read"
on public.news_posts for select
using (status = 'published' and visibility = 'public');

create policy "news_posts_admin_manage"
on public.news_posts for all
using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

create policy "knowledge_items_public_read"
on public.knowledge_items for select
using (status = 'published' and visibility = 'public');

create policy "knowledge_items_admin_manage"
on public.knowledge_items for all
using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

create policy "important_links_public_read"
on public.important_links for select
using (status = 'published' and visibility = 'public');

create policy "important_links_admin_manage"
on public.important_links for all
using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

create policy "initiatives_public_read"
on public.initiatives for select
using (status = 'published' and visibility = 'public');

create policy "initiatives_admin_manage"
on public.initiatives for all
using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

create policy "faqs_public_read"
on public.faqs for select
using (status = 'published' and visibility = 'public');

create policy "faqs_admin_manage"
on public.faqs for all
using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-assets', 'public-assets', true, 10485760, array['image/webp', 'image/png', 'image/jpeg', 'application/pdf']),
  ('hospital-documents', 'hospital-documents', false, 20971520, array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/webp',
    'image/png',
    'image/jpeg'
  ])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "public_assets_read"
on storage.objects for select
using (bucket_id = 'public-assets');

create policy "admin_storage_manage"
on storage.objects for all
using (
  bucket_id in ('public-assets', 'hospital-documents')
  and public.has_admin_role(array['super_admin', 'admin', 'editor'])
)
with check (
  bucket_id in ('public-assets', 'hospital-documents')
  and public.has_admin_role(array['super_admin', 'admin', 'editor'])
);
