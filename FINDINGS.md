# FINDINGS

Things noticed during the design/motion/functionality overhaul that were
deliberately **not** changed, to stay within scope. Each is a candidate for
follow-up work.

## Security / configuration

- **Hardcoded Supabase fallback credentials** — `src/lib/supabase/client.ts`
  embeds a default project URL and publishable key as fallbacks when the
  `VITE_*` env vars are absent. Publishable keys are safe to expose by design,
  but silent fallbacks make it easy to ship a build pointed at the wrong
  project. Consider failing loudly instead.
- **Supabase eager in the initial bundle (~55 KB gzip)** — the client is
  created at module scope and every page imports through it, so it loads with
  the first route even for purely static pages. Lazy-initializing the client
  behind a dynamic import would cut the public first-load by ~a third.
- **`profiles` trigger defaults every new auth user to `viewer`/`active`** —
  fine today (viewer role has no admin policies), but worth an explicit
  `status: 'disabled'` default if self-signup ever gets enabled.

## Architecture / code

- **`usePublishedItems` swallows fetch errors** — public pages silently keep
  fallback content when Supabase is unreachable. Acceptable UX for a portal,
  but there is no operator signal; consider logging to the analytics seam.
- **Zod schema is server-validated only in spirit** — `lib/forms.ts` validates
  client-side with Zod, but the real enforcement is the DB checks + RLS.
  Supabase Edge Functions would be the place for true shared-schema
  validation if requirements harden.
- **`AuthContext`/`PortalProvider` export hooks alongside components** — two
  pre-existing `react-refresh/only-export-components` lint warnings. Moving
  `usePortal`/`useAuth` into their own files fixes HMR granularity.
- **View Transitions API not wired** — React Router 6's `viewTransition` prop
  is still unstable-prefixed in 6.28. Route transitions use the CSS enter
  animation instead; revisit on the Router 7 upgrade.
- **Dynamic OG images** — not possible from a pure client-side SPA; needs an
  edge function or build step if link-preview images per page matter.

## Content / design

- **`footer.css` base background `#0b2f29`** — a stale green from the original
  design, overridden later in the cascade by `visual-identity.css`. Dead
  declarations like this exist in a few places (e.g. `header-nav.css` button
  colors); a cascade cleanup pass would shrink the CSS.
- **Latin/Arabic font is system-served IBM Plex Sans Arabic** — no self-hosted
  subset, so `font-display`/`size-adjust` tuning isn't possible until the font
  files are added to the repo.
- **`data/content.ts` fallback content is large (~1,000 lines)** — it ships in
  the `utilities` chunk (~22 KB gzip). Once the CMS is fully populated, the
  fallback could shrink to skeleton-level stubs.

## Testing

- **No automated test suite** — verification in this overhaul was done with
  ad-hoc Playwright scripts (axe, smoke flows). Promoting those into
  `@playwright/test` specs under `tests/` would lock in the a11y and
  interaction guarantees.
