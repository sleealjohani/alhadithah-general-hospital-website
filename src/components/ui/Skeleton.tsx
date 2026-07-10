/* Skeletons that mirror the shape of the content they stand in for.
   The pulse is opacity-only so it never leaves the compositor, and the
   whole region is announced as busy rather than read out line by line. */

export function Skeleton({ variant = "text", className = "" }: { variant?: "text" | "title" | "block"; className?: string }) {
  return <span className={`skeleton skeleton-${variant} ${className}`} aria-hidden="true" />;
}

/** Card-grid placeholder matching .content-grid / ItemCard geometry. */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="content-grid" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton-card" key={i} aria-hidden="true">
          <span className="skeleton skeleton-icon" />
          <span className="skeleton skeleton-title" />
          <span className="skeleton skeleton-text" />
          <span className="skeleton skeleton-text skeleton-short" />
        </div>
      ))}
      <span className="visually-hidden">…</span>
    </div>
  );
}

/** Full-page placeholder for lazy route loads and CMS page fetches. */
export function SkeletonPage() {
  return (
    <main className="skeleton-page" role="status" aria-busy="true">
      <div className="skeleton-hero">
        <div className="container">
          <span className="skeleton skeleton-text skeleton-short" aria-hidden="true" />
          <span className="skeleton skeleton-title" aria-hidden="true" />
          <span className="skeleton skeleton-text" aria-hidden="true" />
        </div>
      </div>
      <section className="section">
        <div className="container">
          <SkeletonGrid count={3} />
        </div>
      </section>
    </main>
  );
}
