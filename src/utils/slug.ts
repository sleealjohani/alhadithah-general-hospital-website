/* Turn a title into a URL-safe slug. Latin text becomes hyphenated
   lowercase; Arabic (or anything left empty) falls back to a short unique
   token so the NOT NULL / UNIQUE slug column is always satisfied. */
export function slugify(input: string): string {
  const base = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base;
}

/** Always returns a non-empty slug, appending a short suffix for uniqueness. */
export function ensureSlug(preferred: string, ...fallbacks: string[]): string {
  const candidate = slugify(preferred) || fallbacks.map(slugify).find(Boolean) || "";
  const suffix = Math.random().toString(36).slice(2, 6);
  if (!candidate) return `item-${Date.now().toString(36)}-${suffix}`;
  return candidate;
}
