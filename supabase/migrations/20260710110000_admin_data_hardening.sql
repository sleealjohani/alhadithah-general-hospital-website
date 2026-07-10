-- Non-destructive admin/data hardening for the hospital CMS.
-- Focus: faster public reads, safer admin inserts, and clearer link constraints.

alter table public.pages
  alter column created_by set default auth.uid(),
  alter column updated_by set default auth.uid();

alter table public.doctors
  alter column created_by set default auth.uid(),
  alter column updated_by set default auth.uid();

alter table public.file_assets
  alter column created_by set default auth.uid();

create index if not exists services_public_sort_idx
on public.services (sort_order, created_at desc)
where status = 'published' and visibility = 'public';

create index if not exists departments_public_sort_idx
on public.departments (sort_order, created_at desc)
where status = 'published' and visibility = 'public';

create index if not exists news_posts_public_sort_idx
on public.news_posts (sort_order, created_at desc)
where status = 'published' and visibility = 'public';

create index if not exists knowledge_items_public_sort_idx
on public.knowledge_items (sort_order, created_at desc)
where status = 'published' and visibility = 'public';

create index if not exists important_links_public_sort_idx
on public.important_links (sort_order, created_at desc)
where status = 'published' and visibility = 'public';

create index if not exists faqs_public_sort_idx
on public.faqs (sort_order, created_at desc)
where status = 'published' and visibility = 'public';

create index if not exists pages_public_sort_idx
on public.pages (sort_order, created_at desc)
where status = 'published';

create index if not exists doctors_public_sort_idx
on public.doctors (sort_order, created_at desc)
where status = 'published';

create index if not exists navigation_items_public_sort_idx
on public.navigation_items (location, sort_order)
where is_active = true;

create index if not exists homepage_sections_public_sort_idx
on public.homepage_sections (sort_order)
where is_active = true;

create index if not exists quick_links_public_sort_idx
on public.quick_links (audience, sort_order)
where is_active = true;

create index if not exists file_assets_public_idx
on public.file_assets (bucket, created_at desc)
where status = 'published';

do $$
begin
  alter table public.file_assets
    add constraint file_assets_bucket_object_unique unique (bucket, object_path);
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter table public.navigation_items
    add constraint navigation_items_target_format
    check (
      (path is null or path = '' or path like '/%')
      and (url is null or url = '' or url like 'https://%')
    );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter table public.quick_links
    add constraint quick_links_target_format
    check (
      (path is null or path = '' or path like '/%')
      and (url is null or url = '' or url like 'https://%')
    );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter table public.pages
    add constraint pages_slug_not_blank check (length(trim(slug)) > 0);
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter table public.doctors
    add constraint doctors_slug_not_blank check (length(trim(slug)) > 0);
exception
  when duplicate_object then null;
end;
$$;
