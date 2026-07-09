# Deployment

## Before First Deploy

1. Apply both Supabase migrations and the seed file — see `docs/SUPABASE_SETUP.md`.
2. Create the first admin user and assign `super_admin`.
3. Run `npm run typecheck && npm run lint && npm run build` locally to confirm a clean build.

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
```

5. Deploy.

`netlify.toml` already includes SPA redirects so deep links such as `/admin` and `/services` work.

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
