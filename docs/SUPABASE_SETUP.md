# Supabase Setup

Use these steps when the Supabase project is available. Do not hard-code admin credentials in the app.

## 1. Apply Database Migration

In Supabase Dashboard:

1. Open **SQL Editor**.
2. Run `supabase/migrations/202607090001_initial_schema.sql`.
3. Run `supabase/seed.sql`.

Or with the Supabase CLI after logging in:

```bash
supabase db push
supabase db reset
```

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

The migration creates:

- `public-assets` - public images and approved public PDF files.
- `hospital-documents` - private hospital documents.

Allowed uploads exclude executable and web script files. Do not upload patient data, staff personal data, or unapproved images.

## 5. RLS Summary

- Public users can read only `published` and `public` content.
- Public users can insert contact, experience, initiative, and Good Catch submissions.
- Admin users can manage content according to profile role.
- Only `super_admin` can manage user roles.

## 6. Frontend Environment

For local development, create `.env.local`:

```bash
VITE_SUPABASE_URL=https://ihoghgaljgcwitxiywyo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_iYpt-Qh_j_L-u2wkjK773w_JR41i-vt
```

For Netlify, add the same variables in **Site settings → Environment variables**.
