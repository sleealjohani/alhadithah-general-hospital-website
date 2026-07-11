-- Server-side cache for external feeds such as the Al-Jouf Cluster X feed.
-- Public clients do not read or write this table directly; the server function
-- and refresh workflow use the Supabase service-role key and expose only
-- normalized public JSON.

create table if not exists public.external_feed_cache (
  cache_key text primary key,
  source text not null,
  payload jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists external_feed_cache_expires_at_idx
on public.external_feed_cache (expires_at);

drop trigger if exists set_external_feed_cache_updated_at on public.external_feed_cache;

create trigger set_external_feed_cache_updated_at
before update on public.external_feed_cache
for each row execute function public.set_updated_at();

alter table public.external_feed_cache enable row level security;
