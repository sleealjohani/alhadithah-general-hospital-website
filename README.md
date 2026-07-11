# Hadetha General Hospital Digital Portal

Arabic-first bilingual portal for **مستشفى الحديثة العام** under **تجمع الجوف الصحي**.

The app is built for Vercel + Supabase and can be previewed locally from VS Code.

## Stack

- React + Vite + TypeScript, organized as a modular feature-based app (see `docs/ARCHITECTURE.md`)
- Supabase Database + Auth + Storage + RLS, with a full CMS content model
- Vercel deployment (static frontend + `/api` serverless function)
- CSS variables for light/dark/high contrast themes, split into a design-token
  system under `src/styles/`
- Browser-side QR generation and Excel-compatible CSV export

## Local Run

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Production Build

```bash
npm run typecheck
npm run lint
npm run build
```

The production output is in `dist/`.

## Environment

Create `.env.local` from `.env.example` if you want to override Supabase settings:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

The publishable key is safe for frontend use. Do not place service-role keys in this project.

## Important Safety Rules Implemented

- No fake phone numbers, emails, bed counts, or statistics are shown publicly.
- Public contact information remains hidden until an admin adds and approves it.
- Admin login uses Supabase Auth only.
- No hard-coded admin credentials exist in the codebase.
- If Supabase is unavailable, public pages use safe preview content and forms save to local browser storage.

## Content Management

Nearly every part of the public site is editable from `/admin` without touching code:

- **Content** — services, departments, clinics, news, events, knowledge items, links, FAQs
- **Pages** — freeform pages rendered at `/pages/:slug`, with SEO title/description
- **Navigation** — header/footer menu items, including parent nesting
- **Homepage Sections** — show/hide each homepage section
- **Doctors** — staff profiles linked to departments
- **Media Library** — file uploads to Supabase Storage (public or private bucket)
- **Submissions** — contact/feedback/initiative/Good Catch form entries
- **Settings** — site-wide `site_settings` key/value store (e.g. public contact visibility)

See `docs/ADMIN_GUIDE.md` for the full walkthrough.

## Key Files

- `src/app/App.tsx` / `src/app/routes.tsx` - app shell and route table.
- `src/features/public/` - public pages and shared public components.
- `src/features/admin/` - admin dashboard screens (one file per resource).
- `src/features/auth/` - Supabase Auth context, protected routes, login page.
- `src/lib/supabase/` - Supabase client plus per-domain query helpers.
- `src/data/content.ts` - safe bilingual fallback content used when Supabase is unreachable.
- `src/styles/` - design tokens and cascade-ordered CSS partials (see `index.css`).
- `supabase/migrations/20260709120000_initial_schema.sql` - core schema, roles, RLS, storage buckets.
- `supabase/migrations/20260709121000_cms_content_model.sql` - pages, navigation, homepage sections, quick links, doctors, clinics, events.
- `supabase/seed.sql` - starter content without fake contact details.
- `docs/ARCHITECTURE.md` - folder structure and data-flow guide.
- `docs/SUPABASE_SETUP.md` - first admin and Supabase setup.
- `docs/DEPLOYMENT.md` - Vercel deployment.
- `docs/ADMIN_GUIDE.md` - admin operation guide.
- `docs/CONTENT_GUIDE.md` - content tone and publishing rules.
