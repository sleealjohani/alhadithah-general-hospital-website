/**
 * Decorative depth layer for dark sections: an optional slow-drifting aurora
 * mesh plus a fine film-grain overlay. Both are pointer-safe and sit behind
 * content (the section provides the stacking context). Purely visual.
 */
export function LuxBackdrop({ aurora = false }: { aurora?: boolean }) {
  return (
    <>
      {aurora ? <span className="lux-aurora" aria-hidden="true" /> : null}
      <span className="lux-grain" aria-hidden="true" />
    </>
  );
}
