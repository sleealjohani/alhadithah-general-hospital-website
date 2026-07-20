-- Training attendance + auto-generated certificates
--
-- Adds the QR attendance flow on top of Academic Affairs & Training:
--   training_config      singleton settings: timing windows + certificate design
--   training_attendance  per-course check-ins (PII) + skippable feedback
--
-- The single QR points at /attend, which resolves the currently active course
-- from the published courses and these timing windows entirely on the client.
-- Check-in, feedback, and "printed" marks go through SECURITY DEFINER RPCs so
-- the attendance table (which holds national IDs) is never publicly readable.

/* --- Singleton config ---------------------------------------------------- */
create table if not exists public.training_config (
  id boolean primary key default true check (id),
  open_before_min integer not null default 60,   -- attendance opens N min before start
  hide_after_hours integer not null default 3,   -- QR stops showing the course N h after end
  cert_bg_url text,                               -- certificate background (image/pdf)
  cert_word_url text,                             -- optional Word template, for reference
  cert_fields jsonb not null default '{}'::jsonb, -- overlay field positions/styles
  questionnaire jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.training_config (id) values (true) on conflict (id) do nothing;

/* --- Attendance ---------------------------------------------------------- */
create table if not exists public.training_attendance (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.training_courses(id) on delete cascade,
  full_name text not null,
  national_id text,
  employee_number text,
  checked_in_at timestamptz not null default now(),
  certificate_printed_at timestamptz,
  feedback_overall integer,
  feedback_content integer,
  feedback_benefit text,
  feedback_recommend boolean,
  feedback_comment text,
  feedback_at timestamptz
);

create unique index if not exists training_attendance_course_emp_idx
  on public.training_attendance (course_id, employee_number)
  where employee_number is not null and employee_number <> '';
create index if not exists training_attendance_course_idx
  on public.training_attendance (course_id, checked_in_at desc);

drop trigger if exists set_training_config_updated_at on public.training_config;
create trigger set_training_config_updated_at
before update on public.training_config
for each row execute function public.set_updated_at();

/* --- RLS ----------------------------------------------------------------- */
alter table public.training_config enable row level security;
alter table public.training_attendance enable row level security;

-- Config is public read (timing + certificate design are not sensitive); admins manage.
drop policy if exists "training_config_public_read" on public.training_config;
create policy "training_config_public_read" on public.training_config for select using (true);
drop policy if exists "training_config_admin_manage" on public.training_config;
create policy "training_config_admin_manage" on public.training_config for all
  using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
  with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

-- Attendance holds national IDs — no public access at all. Admins read/manage;
-- the public reaches it only through the SECURITY DEFINER RPCs below.
drop policy if exists "training_attendance_admin_manage" on public.training_attendance;
create policy "training_attendance_admin_manage" on public.training_attendance for all
  using (public.has_admin_role(array['super_admin', 'admin', 'reviewer']))
  with check (public.has_admin_role(array['super_admin', 'admin', 'reviewer']));

/* --- Public RPCs --------------------------------------------------------- */

-- Check in to a course. Upserts on (course_id, employee_number) so a repeat scan
-- updates the same row rather than duplicating. Returns the attendance id.
create or replace function public.training_check_in(
  p_course uuid, p_name text, p_national text, p_emp text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_status text;
begin
  if p_name is null or length(trim(p_name)) = 0 then
    return jsonb_build_object('status', 'error', 'message', 'name_required');
  end if;
  select status into v_status from public.training_courses where id = p_course;
  if v_status is null or v_status <> 'published' then
    return jsonb_build_object('status', 'error', 'message', 'course_unavailable');
  end if;

  if p_emp is not null and length(trim(p_emp)) > 0 then
    insert into public.training_attendance (course_id, full_name, national_id, employee_number)
    values (p_course, trim(p_name), nullif(trim(p_national), ''), trim(p_emp))
    on conflict (course_id, employee_number)
      where employee_number is not null and employee_number <> ''
      do update set full_name = excluded.full_name, national_id = excluded.national_id
    returning id into v_id;
  else
    insert into public.training_attendance (course_id, full_name, national_id, employee_number)
    values (p_course, trim(p_name), nullif(trim(p_national), ''), null)
    returning id into v_id;
  end if;

  return jsonb_build_object('status', 'ok', 'id', v_id);
end;
$$;

-- Attach the (optional) satisfaction feedback to an attendance row.
create or replace function public.training_submit_feedback(
  p_id uuid, p_overall integer, p_content integer,
  p_benefit text, p_recommend boolean, p_comment text
) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update public.training_attendance set
    feedback_overall = p_overall,
    feedback_content = p_content,
    feedback_benefit = nullif(trim(p_benefit), ''),
    feedback_recommend = p_recommend,
    feedback_comment = nullif(trim(p_comment), ''),
    feedback_at = now()
  where id = p_id;
  if not found then
    return jsonb_build_object('status', 'error', 'message', 'not_found');
  end if;
  return jsonb_build_object('status', 'ok');
end;
$$;

-- Record that a certificate was printed for this attendance row.
create or replace function public.training_mark_printed(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update public.training_attendance set certificate_printed_at = coalesce(certificate_printed_at, now())
  where id = p_id;
  return jsonb_build_object('status', 'ok');
end;
$$;

grant execute on function public.training_check_in(uuid, text, text, text) to anon, authenticated;
grant execute on function public.training_submit_feedback(uuid, integer, integer, text, boolean, text) to anon, authenticated;
grant execute on function public.training_mark_printed(uuid) to anon, authenticated;
