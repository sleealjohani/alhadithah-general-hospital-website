-- Clinic appointment requests (public booking + registration desk workflow).
--
--   appointment_clinics  bookable clinics with their working days + slot config
--   appointments         patient requests (PII) with a public reference number
--
-- Appointments hold patient PII (national ID, phone, date of birth), so the
-- table has NO public read policy at all. The public site reaches it only
-- through the SECURITY DEFINER RPCs below, which return just the caller's own
-- matching records. Admins/reviewers manage everything through RLS.

create table if not exists public.appointment_clinics (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  description_ar text,
  description_en text,
  instructions_ar text,
  instructions_en text,
  location_ar text,
  location_en text,
  /* 0 = Sunday … 6 = Saturday (matches JS getDay + Postgres extract(dow)). */
  work_days smallint[] not null default '{0,1,2,3,4}',
  slot_start time not null default '08:00',
  slot_end time not null default '14:00',
  slot_minutes integer not null default 20 check (slot_minutes between 5 and 240),
  slot_capacity integer not null default 1 check (slot_capacity > 0),
  lead_days integer not null default 1,   -- earliest bookable day from today
  horizon_days integer not null default 30, -- latest bookable day from today
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  clinic_id uuid references public.appointment_clinics(id) on delete set null,
  clinic_name_ar text,
  clinic_name_en text,
  full_name text not null,
  national_id text not null,
  nationality text,
  phone text not null,
  dob text,
  dob_calendar text not null default 'gregorian' check (dob_calendar in ('gregorian', 'hijri')),
  appointment_date date not null,
  appointment_time time not null,
  notes text,                       -- what the patient wrote
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rescheduled', 'completed', 'cancelled', 'no_show')),
  admin_note text,                  -- shown to the visitor on their status page
  internal_note text,               -- registration desk only, never returned publicly
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_clinic_date_idx on public.appointments (clinic_id, appointment_date);
create index if not exists appointments_status_idx on public.appointments (status, appointment_date desc);
create index if not exists appointments_phone_idx on public.appointments (phone);
create index if not exists appointments_national_idx on public.appointments (national_id);

drop trigger if exists set_appointment_clinics_updated_at on public.appointment_clinics;
create trigger set_appointment_clinics_updated_at before update on public.appointment_clinics
  for each row execute function public.set_updated_at();
drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at before update on public.appointments
  for each row execute function public.set_updated_at();

/* --- RLS ----------------------------------------------------------------- */
alter table public.appointment_clinics enable row level security;
alter table public.appointments enable row level security;

-- Clinics are public read (names + instructions only, no PII); admins manage.
drop policy if exists "appointment_clinics_public_read" on public.appointment_clinics;
create policy "appointment_clinics_public_read" on public.appointment_clinics for select using (is_active);
drop policy if exists "appointment_clinics_admin" on public.appointment_clinics;
create policy "appointment_clinics_admin" on public.appointment_clinics for all
  using (public.has_admin_role(array['super_admin', 'admin', 'editor']))
  with check (public.has_admin_role(array['super_admin', 'admin', 'editor']));

-- Appointments: no public policy whatsoever. Admin/reviewer manage.
drop policy if exists "appointments_admin" on public.appointments;
create policy "appointments_admin" on public.appointments for all
  using (public.has_admin_role(array['super_admin', 'admin', 'reviewer']))
  with check (public.has_admin_role(array['super_admin', 'admin', 'reviewer']));

/* --- Slot availability --------------------------------------------------- */
-- Returns each slot for a clinic/day with how many seats are still free.
-- Only aggregate counts leave the function — never patient rows.
create or replace function public.appointment_slots(p_clinic uuid, p_date date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c public.appointment_clinics%rowtype;
  v_slot time;
  v_taken integer;
  v_out jsonb := '[]'::jsonb;
begin
  select * into c from public.appointment_clinics where id = p_clinic and is_active;
  if not found then
    return jsonb_build_object('status', 'error', 'message', 'clinic_unavailable');
  end if;
  if not (extract(dow from p_date)::smallint = any (c.work_days)) then
    return jsonb_build_object('status', 'closed', 'slots', '[]'::jsonb);
  end if;

  v_slot := c.slot_start;
  while v_slot < c.slot_end loop
    select count(*) into v_taken
    from public.appointments a
    where a.clinic_id = p_clinic
      and a.appointment_date = p_date
      and a.appointment_time = v_slot
      and a.status not in ('cancelled', 'no_show');
    v_out := v_out || jsonb_build_object(
      'time', to_char(v_slot, 'HH24:MI'),
      'free', greatest(c.slot_capacity - v_taken, 0)
    );
    v_slot := v_slot + make_interval(mins => c.slot_minutes);
  end loop;

  return jsonb_build_object('status', 'ok', 'slots', v_out);
end;
$$;

/* --- Booking ------------------------------------------------------------- */
-- Creates a request and returns its public reference number.
create or replace function public.request_appointment(
  p_clinic uuid, p_name text, p_national text, p_nationality text,
  p_phone text, p_dob text, p_dob_calendar text,
  p_date date, p_time time, p_notes text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c public.appointment_clinics%rowtype;
  v_ref text;
  v_taken integer;
  v_id uuid;
  i integer := 0;
begin
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_national), '') = ''
     or coalesce(trim(p_phone), '') = '' then
    return jsonb_build_object('status', 'error', 'message', 'missing_fields');
  end if;

  select * into c from public.appointment_clinics where id = p_clinic and is_active;
  if not found then
    return jsonb_build_object('status', 'error', 'message', 'clinic_unavailable');
  end if;
  if p_date < current_date then
    return jsonb_build_object('status', 'error', 'message', 'date_in_past');
  end if;

  select count(*) into v_taken
  from public.appointments a
  where a.clinic_id = p_clinic and a.appointment_date = p_date
    and a.appointment_time = p_time and a.status not in ('cancelled', 'no_show');
  if v_taken >= c.slot_capacity then
    return jsonb_build_object('status', 'error', 'message', 'slot_full');
  end if;

  -- Readable, collision-checked reference: HGH-YYMMDD-XXXX
  loop
    i := i + 1;
    v_ref := 'HGH-' || to_char(now(), 'YYMMDD') || '-' || lpad((floor(random() * 10000))::int::text, 4, '0');
    exit when not exists (select 1 from public.appointments where reference = v_ref) or i > 20;
  end loop;

  insert into public.appointments (
    reference, clinic_id, clinic_name_ar, clinic_name_en, full_name, national_id,
    nationality, phone, dob, dob_calendar, appointment_date, appointment_time, notes
  ) values (
    v_ref, c.id, c.name_ar, c.name_en, trim(p_name), trim(p_national),
    nullif(trim(p_nationality), ''), trim(p_phone), nullif(trim(p_dob), ''),
    coalesce(nullif(p_dob_calendar, ''), 'gregorian'), p_date, p_time, nullif(trim(p_notes), '')
  ) returning id into v_id;

  return jsonb_build_object('status', 'ok', 'reference', v_ref, 'id', v_id);
end;
$$;

/* --- Lookup / modify / cancel -------------------------------------------- */
-- Finds a visitor's requests by reference number, national ID, or phone.
-- Returns only visitor-facing fields (internal_note is never included).
create or replace function public.lookup_appointments(p_identifier text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_key text; v_out jsonb;
begin
  v_key := trim(coalesce(p_identifier, ''));
  if length(v_key) < 4 then
    return jsonb_build_object('status', 'error', 'message', 'identifier_too_short');
  end if;

  select coalesce(jsonb_agg(row_to_json(x)::jsonb order by x.appointment_date desc), '[]'::jsonb)
  into v_out
  from (
    select a.reference, a.full_name, a.phone, a.national_id, a.nationality,
           a.clinic_name_ar, a.clinic_name_en, a.appointment_date, a.appointment_time,
           a.status, a.admin_note, a.notes, a.created_at,
           c.instructions_ar, c.instructions_en, c.location_ar, c.location_en
    from public.appointments a
    left join public.appointment_clinics c on c.id = a.clinic_id
    where upper(a.reference) = upper(v_key) or a.national_id = v_key or a.phone = v_key
    limit 20
  ) x;

  return jsonb_build_object('status', 'ok', 'items', v_out);
end;
$$;

-- Reschedule or cancel — keyed on the reference number (the strongest of the
-- three identifiers), so a phone/ID lookup alone cannot mutate a booking.
create or replace function public.update_appointment(
  p_reference text, p_date date, p_time time, p_cancel boolean
) returns jsonb language plpgsql security definer set search_path = public as $$
declare a public.appointments%rowtype; c public.appointment_clinics%rowtype; v_taken integer;
begin
  select * into a from public.appointments where upper(reference) = upper(trim(p_reference));
  if not found then
    return jsonb_build_object('status', 'error', 'message', 'not_found');
  end if;
  if a.status in ('completed', 'cancelled') then
    return jsonb_build_object('status', 'error', 'message', 'locked');
  end if;

  if coalesce(p_cancel, false) then
    update public.appointments set status = 'cancelled' where id = a.id;
    return jsonb_build_object('status', 'ok', 'cancelled', true);
  end if;

  select * into c from public.appointment_clinics where id = a.clinic_id and is_active;
  if not found then
    return jsonb_build_object('status', 'error', 'message', 'clinic_unavailable');
  end if;
  if p_date < current_date then
    return jsonb_build_object('status', 'error', 'message', 'date_in_past');
  end if;

  select count(*) into v_taken from public.appointments x
  where x.clinic_id = a.clinic_id and x.appointment_date = p_date
    and x.appointment_time = p_time and x.id <> a.id
    and x.status not in ('cancelled', 'no_show');
  if v_taken >= c.slot_capacity then
    return jsonb_build_object('status', 'error', 'message', 'slot_full');
  end if;

  update public.appointments
  set appointment_date = p_date, appointment_time = p_time, status = 'pending'
  where id = a.id;
  return jsonb_build_object('status', 'ok');
end;
$$;

grant execute on function public.appointment_slots(uuid, date) to anon, authenticated;
grant execute on function public.request_appointment(uuid, text, text, text, text, text, text, date, time, text) to anon, authenticated;
grant execute on function public.lookup_appointments(text) to anon, authenticated;
grant execute on function public.update_appointment(text, date, time, boolean) to anon, authenticated;

/* --- Starter clinics ----------------------------------------------------- */
insert into public.appointment_clinics (name_ar, name_en, work_days, slot_start, slot_end, slot_minutes, sort_order)
select * from (values
  ('العيادة الباطنية', 'Internal Medicine Clinic', '{0,1,2,3,4}'::smallint[], '08:00'::time, '14:00'::time, 20, 10),
  ('عيادة الأطفال', 'Pediatrics Clinic', '{0,1,2,3,4}'::smallint[], '08:00'::time, '14:00'::time, 20, 20),
  ('عيادة النساء والولادة', 'Obstetrics & Gynecology Clinic', '{0,1,2,3,4}'::smallint[], '08:00'::time, '14:00'::time, 20, 30),
  ('عيادة الجراحة', 'Surgery Clinic', '{0,1,2,3}'::smallint[], '08:00'::time, '13:00'::time, 20, 40),
  ('عيادة العظام', 'Orthopedics Clinic', '{0,1,2,3}'::smallint[], '08:00'::time, '13:00'::time, 20, 50),
  ('عيادة الأسنان', 'Dental Clinic', '{0,1,2,3,4}'::smallint[], '08:00'::time, '14:00'::time, 30, 60)
) as v(name_ar, name_en, work_days, slot_start, slot_end, slot_minutes, sort_order)
where not exists (select 1 from public.appointment_clinics);
