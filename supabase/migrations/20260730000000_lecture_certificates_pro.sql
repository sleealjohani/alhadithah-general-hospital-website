-- Lecture certificates — professional upgrade.
-- Extends certificate_events with a configurable certificate title, duration,
-- and per-field overlay positions (so the template is arranged exactly, not
-- hand-placed), and returns them from the public lookup RPC.

alter table public.certificate_events add column if not exists cert_title_ar text;
alter table public.certificate_events add column if not exists cert_title_en text;
alter table public.certificate_events add column if not exists duration_ar text;
alter table public.certificate_events add column if not exists duration_en text;
alter table public.certificate_events add column if not exists cert_fields jsonb not null default '{}'::jsonb;

-- Seed sensible defaults on the existing Viral Hepatitis event (no-op if absent).
update public.certificate_events
set cert_title_ar = coalesce(cert_title_ar, 'شهادة حضور'),
    cert_title_en = coalesce(cert_title_en, 'Certificate of Attendance'),
    duration_ar = coalesce(duration_ar, 'ساعة واحدة'),
    duration_en = coalesce(duration_en, 'One hour')
where true;

-- Return the matched recipient plus the full certificate design.
create or replace function public.lookup_lecture_certificate(p_identifier text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_result jsonb;
begin
  select jsonb_build_object(
    'recipient_id', r.id, 'full_name', r.full_name,
    'employee_number', r.employee_number, 'national_id', r.national_id,
    'event_id', e.id, 'title_ar', e.title_ar, 'title_en', e.title_en,
    'cert_title_ar', e.cert_title_ar, 'cert_title_en', e.cert_title_en,
    'duration_ar', e.duration_ar, 'duration_en', e.duration_en,
    'lecture_date', e.lecture_date, 'template_url', e.template_url,
    'cert_fields', e.cert_fields
  )
  into v_result
  from certificate_recipients r
  join certificate_events e on e.id = r.event_id
  where e.is_active and (r.employee_number = trim(p_identifier) or r.national_id = trim(p_identifier))
  order by e.lecture_date desc limit 1;
  return coalesce(v_result, jsonb_build_object('status', 'not_found'));
end $$;

grant execute on function public.lookup_lecture_certificate(text) to anon, authenticated;
