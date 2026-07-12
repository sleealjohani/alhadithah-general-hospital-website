-- Academic Affairs & Training
--
-- Four tables powering the public Training page and its admin section:
--   training_courses        courses/lectures with a poster, schedule, audience
--   training_media          gallery of media from past courses/lectures
--   training_registrations  public seat bookings for a course (private)
--   training_host_requests  public requests to host a course at the hospital
--
-- Courses + media are publicly readable when published. Registrations and host
-- requests accept public inserts but are readable only by admins/reviewers.

create table if not exists public.training_courses (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  description_ar text,
  description_en text,
  lecturer_ar text,
  lecturer_en text,
  poster_url text,
  audience text not null default 'both' check (audience in ('employees', 'public', 'both')),
  location_ar text,
  location_en text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer,
  register_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_media (
  id uuid primary key default gen_random_uuid(),
  title_ar text,
  title_en text,
  media_url text not null,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  caption_ar text,
  caption_en text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_registrations (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.training_courses(id) on delete set null,
  course_title text,
  full_name text not null,
  phone text not null,
  email text,
  national_id text,
  job_title text,
  audience text,
  notes text,
  status text not null default 'new' check (status in ('new', 'confirmed', 'waitlist', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.training_host_requests (
  id uuid primary key default gen_random_uuid(),
  lecturers text not null,
  course_name text not null,
  duration text,
  audience text,
  phone text not null,
  email text,
  preferred_date date,
  notes text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'approved', 'declined')),
  created_at timestamptz not null default now()
);

create index if not exists training_courses_status_idx on public.training_courses (status, starts_at);
create index if not exists training_media_status_idx on public.training_media (status, sort_order);
create index if not exists training_registrations_course_idx on public.training_registrations (course_id, created_at desc);
create index if not exists training_host_requests_created_idx on public.training_host_requests (created_at desc);

create trigger set_training_courses_updated_at
before update on public.training_courses
for each row execute function public.set_updated_at();

create trigger set_training_media_updated_at
before update on public.training_media
for each row execute function public.set_updated_at();

alter table public.training_courses enable row level security;
alter table public.training_media enable row level security;
alter table public.training_registrations enable row level security;
alter table public.training_host_requests enable row level security;

-- Published courses + media are public; admins/editors manage everything.
create policy "training_courses_public_read"
on public.training_courses for select using (status = 'published');

create policy "training_courses_admin_manage"
on public.training_courses for all
using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

create policy "training_media_public_read"
on public.training_media for select using (status = 'published');

create policy "training_media_admin_manage"
on public.training_media for all
using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

-- Anyone may submit a registration or a hosting request; only staff can read
-- or manage them.
create policy "training_registrations_public_insert"
on public.training_registrations for insert with check (true);

create policy "training_registrations_admin_manage"
on public.training_registrations for all
using (public.has_admin_role(array['super_admin', 'admin', 'reviewer']))
with check (public.has_admin_role(array['super_admin', 'admin', 'reviewer']));

create policy "training_host_requests_public_insert"
on public.training_host_requests for insert with check (true);

create policy "training_host_requests_admin_manage"
on public.training_host_requests for all
using (public.has_admin_role(array['super_admin', 'admin', 'reviewer']))
with check (public.has_admin_role(array['super_admin', 'admin', 'reviewer']));
