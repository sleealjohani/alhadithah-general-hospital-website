# Admin Guide

## Login

Open:

```text
/admin
```

Sign in with a Supabase Auth user. The user must have an active profile row
(see `docs/SUPABASE_SETUP.md` to create the first admin). If you sign in
successfully but have no profile row yet, you'll see first-admin setup
instructions instead of the dashboard — that's expected, not a bug.

## Roles

- `super_admin` - can manage admin roles, `navigation_items`, `site_settings`, and all content.
- `admin` - manages content, settings, and submissions.
- `editor` - manages content (services, pages, homepage sections, doctors, media, etc.).
- `reviewer` - reviews form submissions.
- `viewer` - read-only profile created by default for any new Supabase Auth user.

## Content (`/admin/content`)

Manages every table with the same bilingual shape in one screen: services,
departments, clinics, news, events, knowledge items, links, and FAQs. Switch
tables from the dropdown. Click the pencil icon on a row to load it back into
the form for editing, or the trash icon to delete it.

Public display requires:

```text
status = published
```

(and, for services/departments/clinics/events, `visibility = public`.)

Do not publish:

- Patient data.
- Personal employee contact details.
- Unapproved phone numbers or emails.
- Unverified statistics.
- Images of patients or staff without official approval.

## Pages (`/admin/pages`)

Freeform pages — slug, bilingual title/excerpt/content, SEO title/description,
OG image. A page with `status = published` becomes live immediately at
`/pages/<slug>`. Link to it from **Navigation** so visitors can find it.

## Navigation (`/admin/navigation`)

Controls the header menu (and, by extension, the footer's "Main Links", which
mirrors the header list). Each item has a bilingual label, either an internal
`path` (e.g. `/pages/visitor-guide`) or an external `url`, an optional icon
name, a location (`header`/`footer`/`quick`), an optional parent item for
nesting, a sort order, and an active toggle. If Supabase has no active header
items (or is unreachable), the site falls back to its built-in default menu —
the header never breaks.

## Homepage Sections (`/admin/homepage`)

Each homepage section (hero, quick access, institution, strategy, interactive
path, digital services, journey, knowledge & news) has a row here. Toggle
**Active** off to hide that section from the homepage entirely. The JSON
**content** field is reserved for future per-section configuration — leave it
as `{}` unless you know what a specific key does.

## Doctors (`/admin/doctors`)

Staff/consultant profiles: bilingual name, job title, specialty, bio, an
optional department (pulled live from the Content → departments table),
and a photo URL. Only `status = published` doctors are meant for public
display.

## Media Library (`/admin/media`)

Uploads a file into Supabase Storage and creates a matching metadata row:

- **Public Assets** bucket — for approved public images/PDFs. Files open via
  a permanent public URL.
- **Hospital Documents** bucket — for internal documents. Files open via a
  short-lived signed URL (expires after an hour), matching the bucket's
  private access policy.

Deleting a row removes both the database record and the underlying storage
object. Editing a row only updates its title/visibility/status — to replace
the file itself, delete the row and upload again.

Never upload patient data, personal staff data, or unapproved images/documents.

## Contact Settings

The public contact page intentionally hides phone and email details until real values are approved.

Use **Admin → Settings** to prepare the public-contact setting. Keep `showContact` disabled until the hospital approves the official data.

## Submissions (`/admin/submissions`)

Admin submissions include:

- Contact messages.
- Beneficiary experience feedback.
- Initiative submissions.
- Good Catch reports.

Public submissions are not displayed on the public site.

## QR and Excel

Use **Admin → QR & Export** for QR generation.

Use **Admin → Submissions → Export Excel-compatible CSV** to export the current submission table from the browser. The CSV file opens in Excel and avoids vulnerable spreadsheet-generation dependencies.
