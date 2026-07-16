-- Nursing portal: staff directory, secure PIN sign-in, policies, media,
-- vacation plans, and profile credentials.
--
-- Security model: nursing_staff / sessions / vacation / profile hold personal
-- data and are NOT publicly readable. Staff authenticate with employee number
-- + a PIN (hashed with pgcrypto). All staff-facing reads/writes go through
-- SECURITY DEFINER RPCs that validate a session token and return only the
-- caller's own data. Admins manage everything through normal RLS.

create extension if not exists pgcrypto with schema extensions;

/* --- Tables -------------------------------------------------------------- */

create table if not exists public.nursing_staff (
  id uuid primary key default gen_random_uuid(),
  employee_number text unique not null,
  national_id text,
  full_name text not null,
  birth_date text,
  hire_date text,
  specialty text,
  phone text,
  email text,
  gender text,
  employer text,
  program_type text,
  qualification text,
  nationality text,
  department text,
  staffing_entity text,
  notes text,
  is_manager boolean not null default false,
  is_active boolean not null default true,
  pin_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nursing_sessions (
  token text primary key,
  staff_id uuid not null references public.nursing_staff(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.nursing_policies (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  category_ar text,
  category_en text,
  body_ar text,
  body_en text,
  file_url text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nursing_media (
  id uuid primary key default gen_random_uuid(),
  title_ar text,
  title_en text,
  media_url text not null,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  caption_ar text,
  caption_en text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.nursing_vacation_plans (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.nursing_staff(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  days integer,
  notes text,
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'returned', 'cancelled')),
  manager_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nursing_profile_items (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.nursing_staff(id) on delete cascade,
  kind text not null default 'certificate'
    check (kind in ('certificate', 'license', 'competency', 'health_certificate', 'bls', 'acls', 'other')),
  title text not null,
  issuer text,
  issued_date date,
  expiry_date date,
  file_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nursing_staff_emp_idx on public.nursing_staff (employee_number);
create index if not exists nursing_sessions_staff_idx on public.nursing_sessions (staff_id);
create index if not exists nursing_vacation_staff_idx on public.nursing_vacation_plans (staff_id, created_at desc);
create index if not exists nursing_profile_staff_idx on public.nursing_profile_items (staff_id);
create index if not exists nursing_profile_expiry_idx on public.nursing_profile_items (expiry_date) where status = 'approved';

drop trigger if exists set_nursing_staff_updated_at on public.nursing_staff;
create trigger set_nursing_staff_updated_at before update on public.nursing_staff
  for each row execute function public.set_updated_at();
drop trigger if exists set_nursing_policies_updated_at on public.nursing_policies;
create trigger set_nursing_policies_updated_at before update on public.nursing_policies
  for each row execute function public.set_updated_at();
drop trigger if exists set_nursing_vacation_updated_at on public.nursing_vacation_plans;
create trigger set_nursing_vacation_updated_at before update on public.nursing_vacation_plans
  for each row execute function public.set_updated_at();
drop trigger if exists set_nursing_profile_updated_at on public.nursing_profile_items;
create trigger set_nursing_profile_updated_at before update on public.nursing_profile_items
  for each row execute function public.set_updated_at();

/* --- RLS ----------------------------------------------------------------- */

alter table public.nursing_staff enable row level security;
alter table public.nursing_sessions enable row level security;
alter table public.nursing_policies enable row level security;
alter table public.nursing_media enable row level security;
alter table public.nursing_vacation_plans enable row level security;
alter table public.nursing_profile_items enable row level security;

-- Policies + media: published rows are public (no PII); admins manage.
drop policy if exists "nursing_policies_public_read" on public.nursing_policies;
create policy "nursing_policies_public_read" on public.nursing_policies for select using (status = 'published');
drop policy if exists "nursing_policies_admin" on public.nursing_policies;
create policy "nursing_policies_admin" on public.nursing_policies for all
  using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
  with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

drop policy if exists "nursing_media_public_read" on public.nursing_media;
create policy "nursing_media_public_read" on public.nursing_media for select using (status = 'published');
drop policy if exists "nursing_media_admin" on public.nursing_media;
create policy "nursing_media_admin" on public.nursing_media for all
  using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
  with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

-- Personal tables: NO public access. Admin/reviewer manage; staff reach their
-- own data only through the SECURITY DEFINER RPCs below.
drop policy if exists "nursing_staff_admin" on public.nursing_staff;
create policy "nursing_staff_admin" on public.nursing_staff for all
  using (public.has_admin_role(array['super_admin', 'admin', 'reviewer']))
  with check (public.has_admin_role(array['super_admin', 'admin', 'reviewer']));
drop policy if exists "nursing_vacation_admin" on public.nursing_vacation_plans;
create policy "nursing_vacation_admin" on public.nursing_vacation_plans for all
  using (public.has_admin_role(array['super_admin', 'admin', 'reviewer']))
  with check (public.has_admin_role(array['super_admin', 'admin', 'reviewer']));
drop policy if exists "nursing_profile_admin" on public.nursing_profile_items;
create policy "nursing_profile_admin" on public.nursing_profile_items for all
  using (public.has_admin_role(array['super_admin', 'admin', 'reviewer']))
  with check (public.has_admin_role(array['super_admin', 'admin', 'reviewer']));
-- nursing_sessions: no policies at all → only SECURITY DEFINER functions touch it.

/* --- Helper: safe JSON view of a staff row (no pin_hash) ----------------- */

create or replace function public.nursing_staff_json(s public.nursing_staff)
returns json language sql stable as $$
  select json_build_object(
    'id', s.id, 'employee_number', s.employee_number, 'full_name', s.full_name,
    'specialty', s.specialty, 'department', s.department, 'phone', s.phone,
    'email', s.email, 'gender', s.gender, 'qualification', s.qualification,
    'nationality', s.nationality, 'hire_date', s.hire_date, 'employer', s.employer,
    'is_manager', s.is_manager, 'has_pin', (s.pin_hash is not null)
  );
$$;

/* --- Auth RPCs ----------------------------------------------------------- */

-- Look up sign-in state for an employee number (does a PIN exist yet?).
create or replace function public.nursing_lookup(p_emp text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare s public.nursing_staff;
begin
  select * into s from public.nursing_staff where employee_number = trim(p_emp) and is_active limit 1;
  if not found then return json_build_object('status', 'not_found'); end if;
  return json_build_object('status', 'ok', 'has_pin', (s.pin_hash is not null), 'full_name', s.full_name);
end; $$;

-- First-time PIN creation (only when none is set).
create or replace function public.nursing_set_pin(p_emp text, p_pin text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare s public.nursing_staff; v_token text;
begin
  if length(trim(p_pin)) < 4 then return json_build_object('status', 'weak_pin'); end if;
  select * into s from public.nursing_staff where employee_number = trim(p_emp) and is_active limit 1;
  if not found then return json_build_object('status', 'not_found'); end if;
  if s.pin_hash is not null then return json_build_object('status', 'already_set'); end if;
  update public.nursing_staff set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf')) where id = s.id;
  v_token := gen_random_uuid()::text || gen_random_uuid()::text;
  insert into public.nursing_sessions (token, staff_id, expires_at) values (v_token, s.id, now() + interval '12 hours');
  select * into s from public.nursing_staff where id = s.id;
  return json_build_object('status', 'ok', 'token', v_token, 'staff', public.nursing_staff_json(s));
end; $$;

-- Sign in with an existing PIN.
create or replace function public.nursing_sign_in(p_emp text, p_pin text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare s public.nursing_staff; v_token text;
begin
  select * into s from public.nursing_staff where employee_number = trim(p_emp) and is_active limit 1;
  if not found then return json_build_object('status', 'not_found'); end if;
  if s.pin_hash is null then return json_build_object('status', 'needs_pin'); end if;
  if extensions.crypt(p_pin, s.pin_hash) <> s.pin_hash then return json_build_object('status', 'invalid'); end if;
  v_token := gen_random_uuid()::text || gen_random_uuid()::text;
  insert into public.nursing_sessions (token, staff_id, expires_at) values (v_token, s.id, now() + interval '12 hours');
  return json_build_object('status', 'ok', 'token', v_token, 'staff', public.nursing_staff_json(s));
end; $$;

-- Resolve a session token to the staff id (internal helper).
create or replace function public.nursing_session_staff(p_token text)
returns uuid language sql security definer set search_path = public as $$
  select staff_id from public.nursing_sessions where token = p_token and expires_at > now();
$$;

-- The signed-in staff member: own profile + vacations + credential items.
create or replace function public.nursing_me(p_token text)
returns json language plpgsql security definer set search_path = public as $$
declare v_id uuid; s public.nursing_staff;
begin
  v_id := public.nursing_session_staff(p_token);
  if v_id is null then return json_build_object('status', 'unauthorized'); end if;
  select * into s from public.nursing_staff where id = v_id;
  return json_build_object(
    'status', 'ok',
    'staff', public.nursing_staff_json(s),
    'vacations', coalesce((select json_agg(v order by v.created_at desc) from public.nursing_vacation_plans v where v.staff_id = v_id), '[]'::json),
    'profile', coalesce((select json_agg(p order by p.created_at desc) from public.nursing_profile_items p where p.staff_id = v_id), '[]'::json)
  );
end; $$;

create or replace function public.nursing_submit_vacation(p_token text, p_start date, p_end date, p_notes text)
returns json language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  v_id := public.nursing_session_staff(p_token);
  if v_id is null then return json_build_object('status', 'unauthorized'); end if;
  insert into public.nursing_vacation_plans (staff_id, start_date, end_date, days, notes)
  values (v_id, p_start, p_end, greatest(1, (p_end - p_start) + 1), p_notes);
  return json_build_object('status', 'ok');
end; $$;

create or replace function public.nursing_add_profile_item(
  p_token text, p_kind text, p_title text, p_issuer text, p_issued date, p_expiry date, p_file text)
returns json language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  v_id := public.nursing_session_staff(p_token);
  if v_id is null then return json_build_object('status', 'unauthorized'); end if;
  insert into public.nursing_profile_items (staff_id, kind, title, issuer, issued_date, expiry_date, file_url)
  values (v_id, coalesce(p_kind, 'certificate'), p_title, p_issuer, p_issued, p_expiry, p_file);
  return json_build_object('status', 'ok');
end; $$;

-- Manager-only overview: all staff plus credential-expiry KPIs.
create or replace function public.nursing_manager_overview(p_token text)
returns json language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_is_manager boolean;
begin
  v_id := public.nursing_session_staff(p_token);
  if v_id is null then return json_build_object('status', 'unauthorized'); end if;
  select is_manager into v_is_manager from public.nursing_staff where id = v_id;
  if not coalesce(v_is_manager, false) then return json_build_object('status', 'forbidden'); end if;
  return json_build_object(
    'status', 'ok',
    'staff', coalesce((select json_agg(json_build_object(
        'id', s.id, 'employee_number', s.employee_number, 'full_name', s.full_name,
        'specialty', s.specialty, 'department', s.department, 'phone', s.phone,
        'is_active', s.is_active
      ) order by s.full_name) from public.nursing_staff s), '[]'::json),
    'expiring', coalesce((select json_agg(json_build_object(
        'staff', s.full_name, 'department', s.department, 'kind', p.kind,
        'title', p.title, 'expiry_date', p.expiry_date
      ) order by p.expiry_date) from public.nursing_profile_items p
      join public.nursing_staff s on s.id = p.staff_id
      where p.status = 'approved' and p.expiry_date is not null
        and p.expiry_date <= (current_date + interval '60 days')), '[]'::json),
    'pending_vacations', (select count(*) from public.nursing_vacation_plans where status = 'submitted'),
    'pending_profile', (select count(*) from public.nursing_profile_items where status = 'pending')
  );
end; $$;

/* Expose only the RPCs to the anon/auth roles (tables stay locked by RLS). */
grant execute on function public.nursing_lookup(text) to anon, authenticated;
grant execute on function public.nursing_set_pin(text, text) to anon, authenticated;
grant execute on function public.nursing_sign_in(text, text) to anon, authenticated;
grant execute on function public.nursing_me(text) to anon, authenticated;
grant execute on function public.nursing_submit_vacation(text, date, date, text) to anon, authenticated;
grant execute on function public.nursing_add_profile_item(text, text, text, text, date, date, text) to anon, authenticated;
grant execute on function public.nursing_manager_overview(text) to anon, authenticated;
