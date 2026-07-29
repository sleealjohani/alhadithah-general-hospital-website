-- Self-service lecture certificates managed by Academic Affairs & Training.
create table public.certificate_events (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null default '',
  lecture_date date not null,
  template_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.certificate_recipients (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.certificate_events(id) on delete cascade,
  full_name text not null,
  national_id text,
  employee_number text,
  created_at timestamptz not null default now(),
  check (coalesce(nullif(national_id, ''), nullif(employee_number, '')) is not null)
);
create unique index certificate_recipient_national_idx on public.certificate_recipients(event_id, national_id) where national_id is not null;
create unique index certificate_recipient_employee_idx on public.certificate_recipients(event_id, employee_number) where employee_number is not null;

alter table public.certificate_events enable row level security;
alter table public.certificate_recipients enable row level security;
create policy "certificate_events_public_active" on public.certificate_events for select using (is_active);
create policy "certificate_events_admin" on public.certificate_events for all
  using (public.has_admin_role(array['super_admin','admin','editor']))
  with check (public.has_admin_role(array['super_admin','admin','editor']));
create policy "certificate_recipients_admin" on public.certificate_recipients for all
  using (public.has_admin_role(array['super_admin','admin','editor']))
  with check (public.has_admin_role(array['super_admin','admin','editor']));

create trigger set_certificate_events_updated_at before update on public.certificate_events
for each row execute function public.set_updated_at();

-- Only returns the matched recipient; the recipient table itself is never public.
create or replace function public.lookup_lecture_certificate(p_identifier text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_result jsonb;
begin
  select jsonb_build_object('recipient_id', r.id, 'full_name', r.full_name,
    'employee_number', r.employee_number, 'national_id', r.national_id,
    'event_id', e.id, 'title_ar', e.title_ar, 'title_en', e.title_en,
    'lecture_date', e.lecture_date, 'template_url', e.template_url)
  into v_result from certificate_recipients r join certificate_events e on e.id=r.event_id
  where e.is_active and (r.employee_number=trim(p_identifier) or r.national_id=trim(p_identifier))
  order by e.lecture_date desc limit 1;
  return coalesce(v_result, jsonb_build_object('status','not_found'));
end $$;
grant execute on function public.lookup_lecture_certificate(text) to anon, authenticated;

do $$ declare v_event uuid; begin
  insert into certificate_events(title_ar,title_en,lecture_date)
  values ('التهاب الكبد الفيروسي','Viral Hepatitis','2026-07-28') returning id into v_event;
  insert into certificate_recipients(event_id,full_name,national_id,employee_number) values
  (v_event,'مشاعل عايد العنزي','1098015033','50570476'),(v_event,'نواف عبدالله البلوى','1065535534','51563541'),
  (v_event,'افراح معانق الرويلي','1075719805','6527967'),(v_event,'فادية الحميدي العنزي','1072625542','6527653'),
  (v_event,'تمام مسعد البلوي','1071623894','115480'),(v_event,'علياء (عليا) موقف الرويلي','1062683790','128914'),
  (v_event,'اسيا حسين بكري','1075172435','4506212'),(v_event,'هنوف مهدي الرويلي','1064241878','6529827'),
  (v_event,'سارة ساري فرحان الشراري','1096597834','51634878'),(v_event,'اصيل محمد سعيد الشراري','1110626700','51622426'),
  (v_event,'سلطان عبدالله ربيع العنزي','1034218741','4602605'),(v_event,'سلمان حمدان العنزي','1055883456','51517764'),
  (v_event,'عبدالله محمد العنزي','1034056109','4507638'),(v_event,'بدر حمود مطير الشراري','1032631457','4501541'),
  (v_event,'أحمد محمد مقبل الشراري','1021470263','44108'),(v_event,'جواهر قاسم تركي الشعلان','108528824','51510'),
  (v_event,'غاليه عودي مشابط العازمي','1073536425','4708646'),(v_event,'أيمن محمد صالح تركستاني','1095695282',null);
end $$;
