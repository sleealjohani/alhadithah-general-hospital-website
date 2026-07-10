# Deployment

## Before First Deploy

1. Apply both Supabase migrations and the seed file — see `docs/SUPABASE_SETUP.md`.
2. Create the first admin user and assign `super_admin`.
3. Run `npm run typecheck && npm run lint && npm run build` locally to confirm a clean build.
4. Replace every `REPLACE-WITH-PRODUCTION-DOMAIN` placeholder in
   `public/robots.txt` and `public/sitemap.xml` with the real production
   domain once it's known — search engines require absolute URLs there, and
   this repo doesn't have a domain to fill in yet.

## Netlify

1. Push this repository to GitHub.
2. In Netlify, create a new site from Git.
3. Use these build settings:

```text
Build command: npm run build
Publish directory: dist
```

4. Add environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
X_BEARER_TOKEN
```

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `X_BEARER_TOKEN` are server-side only and are used by the Netlify Function behind `/api/x-feed`. Never prefix them with `VITE_`.

5. Deploy.

`netlify.toml` already includes SPA redirects so deep links such as `/admin` and `/services` work.

## X Feed

The homepage news card calls `/api/x-feed`, which runs as a Netlify Function. The function uses X Recent Search with this query:

```text
from:AljoufCluster -is:retweet
```

Apply `supabase/migrations/20260710180000_external_feed_cache.sql` before production deployment so the function can cache the latest response in Supabase. If `X_BEARER_TOKEN` is missing or X is temporarily unavailable, the site shows cached posts when available and otherwise falls back to a button that opens the last seven days on X.

Required X access:

```text
X_BEARER_TOKEN=<X API app bearer token>
```

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
