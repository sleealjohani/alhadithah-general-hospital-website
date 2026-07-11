# Deployment

## Before First Deploy

1. Apply both Supabase migrations and the seed file — see `docs/SUPABASE_SETUP.md`.
2. Create the first admin user and assign `super_admin`.
3. Run `npm run typecheck && npm run lint && npm run build` locally to confirm a clean build.
4. Replace every `REPLACE-WITH-PRODUCTION-DOMAIN` placeholder in
   `public/robots.txt` and `public/sitemap.xml` with the real production
   domain once it's known — search engines require absolute URLs there, and
   this repo doesn't have a domain to fill in yet.

## Vercel

1. Push this repository to GitHub.
2. In Vercel, import the repository as a new project. The framework is
   auto-detected as **Vite** (build `npm run build`, output `dist`).
   `vercel.json` already sets this plus the SPA rewrite, so deep links such as
   `/admin` and `/services` work.
3. Add environment variables (Project → Settings → Environment Variables) for
   all environments:

```text
VITE_SUPABASE_URL                # client — Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY    # client — anon/publishable key
SUPABASE_URL                     # server — same project URL
SUPABASE_SERVICE_ROLE_KEY        # server — service_role key
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are server-side only and are
used by the function behind `/api/x-feed`. Never prefix them with `VITE_`.

4. Deploy.

## X Feed

The homepage news card calls `/api/x-feed` (a Vercel function at
`api/x-feed.js`). X blocks the free syndication endpoint from datacenter IPs
(Vercel, Netlify), so the feed is populated out-of-band:

1. The scheduled GitHub Action `.github/workflows/refresh-x-feed.yml` runs
   `scripts/refresh-x-feed.mjs` on GitHub's runners (an IP X serves), fetches
   the public @AljoufCluster syndication timeline, and upserts it into the
   Supabase `external_feed_cache` table.
2. `/api/x-feed` returns that cached copy. If the cache is stale it makes a
   best-effort live fetch, then falls back to the stale cache. The card is
   never blank — with no data it shows a "follow @AljoufCluster on X" button.

Requirements:

- Apply `supabase/migrations/20260710180000_external_feed_cache.sql` before
  production deployment.
- Add the two GitHub repository secrets the Action needs (Settings → Secrets
  and variables → Actions): `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

No paid X API access or `X_BEARER_TOKEN` is required.

## Local Preview

```bash
npm install
npm run build
npm run preview
```

Open:

```text
http://localhost:4173
```

## Local Development

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Notes

- This version is static frontend + Supabase. There is no Node server to maintain.
- The app is still safe to open without Supabase access; it uses preview content and stores form submissions locally.
- Do not deploy with service-role keys or private credentials in frontend environment variables.
