# Supabase Setup

Use these steps when the Supabase project is available. Do not hard-code admin credentials in the app.

## Migration Files

There are two migration files, applied in order. Both are named in the
`YYYYMMDDHHMMSS_description.sql` format the Supabase CLI and GitHub
integration expect, so they sort and apply correctly:

- `supabase/migrations/20260709120000_initial_schema.sql` - profiles/roles, RLS
  helper functions, the core content tables (services, departments, news_posts,
  knowledge_items, important_links, initiatives, faqs), submission tables
  (contact_messages, experience_feedback, initiative_submissions,
  good_catch_reports), file_assets, activity_logs, and storage buckets.
- `supabase/migrations/20260709121000_cms_content_model.sql` - the rest of the
  CMS content model: `pages`, `page_sections`, `navigation_items`,
  `homepage_sections`, `quick_links`, `doctors`, `clinics`, `events`.

As of this writing, **neither migration has been applied to the live
project** — the schema does not exist there yet. Pick one of the options
below.

## Option A — Automatic via the Supabase GitHub Integration

If you connected the Supabase project to this GitHub repo from the Supabase
dashboard (Project Settings → Integrations → GitHub), Supabase watches a
single **production branch** in this repo and automatically applies any new
files under `supabase/migrations/` whenever that branch is updated.

1. In the Supabase Dashboard, open **Project Settings → Integrations →
   GitHub** and confirm two things:
   - **Repository**: `sleealjohani/alhadithah-general-hospital-website` is connected.
   - **Production branch**: note which branch it's set to (commonly `main`).
     Migrations only auto-deploy when they land on *this* branch.
   - **Supabase directory**: should be `supabase` (the default) — that's
     where this repo's `migrations/` folder lives.
2. All current work is on `claude/hadetha-hospital-rebuild-zwrjcw`, not on
   the production branch. Merge it in — either:
   - Open a pull request from `claude/hadetha-hospital-rebuild-zwrjcw` into
     the configured production branch and merge it (recommended — Supabase
     posts a diff/status check on the PR itself before merge, so you can
     review exactly what SQL will run), or
   - Fast-forward/merge the branch directly if you don't need a PR review step.
3. On merge, Supabase detects the two new migration files and applies them
   to the linked project. Check **Database → Migrations** in the Supabase
   Dashboard — both filenames should appear there marked as applied within
   a minute or two of the push.
4. **The GitHub integration does not run `seed.sql`** — migrations only.
   After the migrations apply, run `supabase/seed.sql` once yourself in
   **SQL Editor** (paste the file's contents, click Run).
5. Continue with "Create the First Admin User" below.

If you'd like me to open that pull request for you, just ask.

## Option B — Manual via SQL Editor

Use this if the GitHub integration isn't set up, or you'd rather apply
changes by hand:

1. Open **SQL Editor** in the Supabase Dashboard.
2. Run `supabase/migrations/20260709120000_initial_schema.sql`.
3. Run `supabase/migrations/20260709121000_cms_content_model.sql`.
4. Run `supabase/seed.sql`.

Run them in that exact order — the second migration references functions
created by the first, and the seed file inserts rows into tables created by
both.

## Option C — Supabase CLI (if you have it linked locally)

If you have the Supabase CLI installed and already linked to this project
(`supabase link`) with your own credentials, `supabase db push` applies every
unapplied migration in order in one command. This repo's assistant session
does not have — and will not ask you for — the access token or database
password this requires, so this option is for your own local use only.

## Create the First Admin User

In Supabase Dashboard:

1. Go to **Authentication → Users**.
2. Click **Add user**.
3. Enter the official admin email and a temporary password.
4. Confirm the user if your Auth settings require confirmation.

The migration creates a matching row in `public.profiles` with role `viewer`.

## Assign Super Admin Role

Run this in Supabase SQL Editor, replacing the email:

```sql
update public.profiles
set role = 'super_admin',
    status = 'active'
where email = 'admin@example.com';
```

Confirm:

```sql
select id, email, role, status
from public.profiles
where email = 'admin@example.com';
```

## Storage Buckets

The initial migration creates:

- `public-assets` - public images and approved public PDF files.
- `hospital-documents` - private hospital documents.

Allowed uploads exclude executable and web script files. Do not upload patient data, staff personal data, or unapproved images.

The admin **Media Library** screen (`/admin/media`) uploads directly into
these buckets and creates a matching `file_assets` row. Files in
`public-assets` are opened via a public URL; files in `hospital-documents`
are opened via a short-lived signed URL, matching the bucket's private RLS
policy.

## Schema Overview

| Table | Purpose | Admin screen |
| --- | --- | --- |
| `profiles` | role + status per auth user | (managed via SQL, see "Assign Super Admin Role") |
| `site_settings` | key/value site config (e.g. public contact visibility) | Settings |
| `services`, `departments`, `clinics`, `news_posts`, `events`, `knowledge_items`, `important_links`, `faqs` | bilingual content cards, identical shape | Content |
| `pages` | freeform pages rendered at `/pages/:slug`, with SEO fields | Pages |
| `page_sections` | ordered content blocks belonging to a page | (schema only — not yet exposed in admin) |
| `navigation_items` | header/footer/quick-link menu entries, with parent nesting | Navigation |
| `homepage_sections` | per-section visibility + JSON config for the homepage | Homepage Sections |
| `quick_links` | homepage quick-access tiles | (schema only — not yet exposed in admin) |
| `doctors` | staff profiles, linked to `departments` | Doctors |
| `file_assets` | metadata for uploaded Storage objects | Media Library |
| `contact_messages`, `experience_feedback`, `initiative_submissions`, `good_catch_reports` | public form submissions | Submissions |
| `activity_logs` | admin action audit trail | (schema only — not yet exposed in admin) |

## RLS Summary

- Public users can read only `published`/`status = 'published'` (or
  `is_active = true` for nav/homepage-section rows) content.
- Public users can insert contact, experience, initiative, and Good Catch submissions.
- Admin/editor roles can manage content according to the table's policy
  (see the migration files for the exact role list per table).
- Only `super_admin`/`admin` can manage `navigation_items` and `site_settings`
  (site structure), and only `super_admin` can manage user roles.

## Frontend Environment

For local development, create `.env.local`:

```bash
VITE_SUPABASE_URL=https://ihoghgaljgcwitxiywyo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_iYpt-Qh_j_L-u2wkjK773w_JR41i-vt
```

For Vercel, add the same variables in **Project → Settings → Environment Variables**.
