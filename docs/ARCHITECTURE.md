# Architecture

This app is a client-side React + Vite SPA (no server runtime) backed entirely
by Supabase (Postgres + Auth + Storage). There is no server-side rendering, so
every page fetches its own data client-side and falls back to safe static
content when Supabase is unreachable or unconfigured.

## Folder structure

```text
src/
  app/                     Root component + route table
    App.tsx                Wraps PortalProvider, AuthProvider, BrowserRouter
    routes.tsx              All <Route> definitions

  providers/
    PortalProvider.tsx      Locale/theme/accessibility state + toast notifications

  features/
    auth/                  Supabase Auth
      AuthContext.tsx       Reactive session/profile state via onAuthStateChange
      ProtectedRoute.tsx     Route guard (loading / no-profile / unauthenticated / role check)
      AdminLoginPage.tsx
    admin/                 One file per admin dashboard screen
      AdminLayout.tsx        Sidebar + topbar shell, nested <Routes>
      AdminDashboard.tsx
      AdminContentManager.tsx  Generic CRUD for services/departments/clinics/news/events/knowledge/links/faqs
      AdminPages.tsx           CRUD for the `pages` table
      AdminNavigation.tsx      CRUD for `navigation_items`
      AdminHomepageSections.tsx CRUD for `homepage_sections` (JSON content editor)
      AdminDoctors.tsx         CRUD for `doctors`
      AdminMedia.tsx           Supabase Storage upload + `file_assets` CRUD
      AdminSubmissions.tsx     Read/export form submissions
      AdminTools.tsx           QR generator
      AdminSettings.tsx        `site_settings` editor
      AdminSetupContent.tsx    First-admin instructions
    public/
      pages/                 One component per public route (HomePage, AboutPage, ...)
      components/            DirectoryPage (search/filter list), PublicForm

  components/
    layout/                 Header, Footer, PublicLayout, ScrollToTop, AccessibilityPanel
    ui/                     PageHero, SectionHeading, ContentGrid, ItemCard, Icon

  lib/
    supabase/
      client.ts              Supabase client singleton (safe to import anywhere)
      content.ts              fetchPublishedContent / mapRowToItem for the generic content tables
      navigation.ts            fetchNavigationItems
      homepageSections.ts       fetchHomepageSectionVisibility
      pages.ts                  fetchPageBySlug
    forms.ts                 Form submission (Supabase insert with localStorage fallback)
    exports.ts                QR code + CSV export helpers

  hooks/
    usePublishedItems.ts      Live Supabase data with static fallback (used by all directory pages)
    useNavigationItems.ts      Same pattern for header/footer nav
    useHomepageSectionVisibility.ts  Section on/off map
    useScrollReveal.ts         IntersectionObserver scroll-reveal animation

  data/
    content.ts                Static bilingual fallback content: identity, nav items, all
                               PortalItem arrays (services, departments, ...), contentTables,
                               roleLabels. This is what renders before Supabase responds, and
                               what renders if Supabase is unreachable.

  types/index.ts              Shared TypeScript types (Locale, PortalItem, AdminRole, ...)
  constants/adminNav.ts        Admin sidebar nav config
  utils/                       tx() i18n helper, localValue() storage helper, displayRowValue()

  styles/
    index.css                 Imports every partial below, in cascade order — this order matters
    tokens.css                 CSS custom properties: color, typography, spacing, radius, shadow
    base.css, header-nav.css, hero.css, home-sections.css, sections-generic.css,
    cards-forms.css, footer.css, utility-widgets.css, admin-auth.css,
    motion-utilities.css, responsive.css
```

## The fetch-with-fallback pattern

Every piece of Supabase-backed public content follows the same shape:

1. A function in `lib/supabase/*.ts` does `if (!supabase) return <empty>` then
   queries Postgres, swallowing errors into an empty/false result rather than
   throwing.
2. A hook in `hooks/*.ts` calls that function in a `useEffect`, and **only
   overwrites the static fallback if the fetch returned something**. If
   Supabase is unconfigured, unreachable, or the table is empty, the UI keeps
   showing the safe static content from `data/content.ts`.

This is why the site works out of the box even before Supabase migrations are
applied, and why it degrades gracefully rather than crashing if the project
goes offline.

## Auth flow

`AuthContext` (`features/auth/AuthContext.tsx`) is the single source of truth
for the current session:

- On mount, calls `supabase.auth.getSession()` once, then subscribes to
  `onAuthStateChange` so login/logout/token-refresh anywhere update the whole
  app reactively.
- After a session appears, it loads the matching `profiles` row. If there's
  no active profile row, status becomes `"no-profile"` (shown as the
  first-admin setup instructions) rather than silently failing.
- `hasRole(allowedRoles)` is the building block for role-gated UI.

`ProtectedRoute` wraps `/admin/*` and renders one of: a loading spinner, the
setup notice, a redirect to `/admin/login`, or the actual admin layout —
driven entirely by `AuthContext`'s status.

## Adding a new admin-managed content type

1. Add the table + RLS policies in a new `supabase/migrations/*.sql` file
   (never edit an already-applied migration — add a new one).
2. If it fits the generic bilingual `title_ar/title_en/description_ar/description_en/category_ar/category_en/icon/status`
   shape, just add it to `contentTables` in `data/content.ts` — it's
   immediately editable in `AdminContentManager`, no new UI needed.
3. Otherwise, copy the pattern in `features/admin/AdminDoctors.tsx` (or any
   other dedicated screen): local form state, `loadRows`/`edit`/`save`/`remove`
   against `supabase.from("<table>")`, registered as a route in
   `AdminLayout.tsx` and an entry in `constants/adminNav.ts`.
4. If the public site should read it, add a `lib/supabase/<name>.ts` fetch
   function and a hook following the fetch-with-fallback pattern above, then
   use the hook from the relevant public page/component.

## Design system

`styles/tokens.css` defines the full palette (light + dark + high-contrast),
typography, spacing/radius/shadow scale as CSS custom properties. Every other
`styles/*.css` partial consumes those variables — no component hardcodes a
color. `styles/index.css`'s `@import` order matches the original single-file
cascade order exactly, so partials must stay in that order if you add a new
one (verified by reconstructing byte-for-byte against the pre-split file
during the refactor).
