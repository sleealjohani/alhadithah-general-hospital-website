# Supabase Setup

Use these steps when the Supabase project is available. Do not hard-code admin credentials in the app.

## 1. Apply Database Migrations

There are two migration files, applied in order:

- `supabase/migrations/202607090001_initial_schema.sql` - profiles/roles, RLS
  helper functions, the core content tables (services, departments, news_posts,
  knowledge_items, important_links, initiatives, faqs), submission tables
  (contact_messages, experience_feedback, initiative_submissions,
  good_catch_reports), file_assets, activity_logs, and storage buckets.
- `supabase/migrations/202607090002_cms_content_model.sql` - the rest of the
  CMS content model: `pages`, `page_sections`, `navigation_items`,
  `homepage_sections`, `quick_links`, `doctors`, `clinics`, `events`.

In Supabase Dashboard:

1. Open **SQL Editor**.
2. Run `supabase/migrations/202607090001_initial_schema.sql`.
3. Run `supabase/migrations/202607090002_cms_content_model.sql`.
4. Run `supabase/seed.sql`.

Or with the Supabase CLI after logging in:

```bash
supabase db push
```

`supabase db push` applies every migration file in order automatically — you
do not need to run them individually when using the CLI.

## 2. Create the First Admin User

In Supabase Dashboard:

1. Go to **Authentication → Users**.
2. Click **Add user**.
3. Enter the official admin email and a temporary password.
4. Confirm the user if your Auth settings require confirmation.

The migration creates a matching row in `public.profiles` with role `viewer`.

## 3. Assign Super Admin Role

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

## 4. Storage Buckets

The initial migration creates:

- `public-assets` - public images and approved public PDF files.
- `hospital-documents` - private hospital documents.

Allowed uploads exclude executable and web script files. Do not upload patient data, staff personal data, or unapproved images.

The admin **Media Library** screen (`/admin/media`) uploads directly into
these buckets and creates a matching `file_assets` row. Files in
`public-assets` are opened via a public URL; files in `hospital-documents`
are opened via a short-lived signed URL, matching the bucket's private RLS
policy.

## 5. Schema Overview

| Table | Purpose | Admin screen |
| --- | --- | --- |
| `profiles` | role + status per auth user | (managed via SQL, see step 3) |
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

## 6. RLS Summary

- Public users can read only `published`/`status = 'published'` (or
  `is_active = true` for nav/homepage-section rows) content.
- Public users can insert contact, experience, initiative, and Good Catch submissions.
- Admin/editor roles can manage content according to the table's policy
  (see the migration files for the exact role list per table).
- Only `super_admin`/`admin` can manage `navigation_items` and `site_settings`
  (site structure), and only `super_admin` can manage user roles.

## 7. Frontend Environment

For local development, create `.env.local`:

```bash
VITE_SUPABASE_URL=https://ihoghgaljgcwitxiywyo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_iYpt-Qh_j_L-u2wkjK773w_JR41i-vt
```

For Netlify, add the same variables in **Site settings → Environment variables**.
