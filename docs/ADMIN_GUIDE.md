# Admin Guide

## Login

Open:

```text
/admin
```

Sign in with a Supabase Auth user. The user must have an active profile row.

## Roles

- `super_admin` - can manage admin roles and all content.
- `admin` - manages content, settings, and submissions.
- `editor` - manages content.
- `reviewer` - reviews form submissions.
- `viewer` - read-only profile created by default.

## Content

Use **Admin → Content** to add bilingual records.

Public display requires:

```text
status = published
visibility = public
```

Do not publish:

- Patient data.
- Personal employee contact details.
- Unapproved phone numbers or emails.
- Unverified statistics.
- Images of patients or staff without official approval.

## Contact Settings

The public contact page intentionally hides phone and email details until real values are approved.

Use **Admin → Settings** to prepare the public-contact setting. Keep `showContact` disabled until the hospital approves the official data.

## Submissions

Admin submissions include:

- Contact messages.
- Beneficiary experience feedback.
- Initiative submissions.
- Good Catch reports.

Public submissions are not displayed on the public site.

## QR and Excel

Use **Admin → QR & Export** for QR generation.

Use **Admin → Submissions → Export Excel-compatible CSV** to export the current submission table from the browser. The CSV file opens in Excel and avoids vulnerable spreadsheet-generation dependencies.
