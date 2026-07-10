import { useEffect } from "react";

const CARD_SELECTOR = ".info-card, .mini-card";

/**
 * One delegated, rAF-throttled pointermove listener that feeds --mouse-x/-y
 * to whichever card the pointer is over, powering the CSS highlight gradient.
 * No-ops entirely on touch devices and under reduced motion.
 */
export function useCardGlow() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    let lastEvent: PointerEvent | null = null;

    const onMove = (event: PointerEvent) => {
      lastEvent = event;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const e = lastEvent;
        if (!e) return;
        const card = (e.target as Element | null)?.closest?.(CARD_SELECTOR);
        if (!(card instanceof HTMLElement)) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
      });
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
}
