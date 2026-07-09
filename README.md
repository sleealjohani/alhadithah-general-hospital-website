# Hadetha General Hospital Digital Portal

Arabic-first bilingual portal for **مستشفى الحديثة العام** under **تجمع الجوف الصحي**.

The app is built for Netlify + Supabase and can be previewed locally from VS Code.

## Stack

- React + Vite + TypeScript
- Supabase Database + Auth + Storage + RLS
- Netlify static deployment
- CSS variables for light/dark/high contrast themes
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

## Key Files

- `src/App.tsx` - public site, forms, admin shell, QR/export tools.
- `src/lib/data.ts` - safe bilingual fallback content.
- `src/lib/supabase.ts` - Supabase client and content fetching.
- `supabase/migrations/202607090001_initial_schema.sql` - database, RLS, storage policies.
- `supabase/seed.sql` - starter content without fake contact details.
- `docs/SUPABASE_SETUP.md` - first admin and Supabase setup.
- `docs/DEPLOYMENT.md` - Netlify deployment.
- `docs/ADMIN_GUIDE.md` - admin operation guide.
