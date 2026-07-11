import { useEffect } from "react";

const SELECTOR = "[data-reveal]";
const STAGGER_MS = 60;
const STAGGER_CAP_MS = 300;

/**
 * Scroll-reveal engine for the declarative [data-reveal] markup used across
 * the public pages. Routes are lazy-loaded, so a one-shot querySelectorAll
 * misses everything below the first chunk — a MutationObserver registers
 * elements as they mount instead.
 *
 * Contract: reveals fire once, never re-animate on scroll-up, and content
 * already inside the viewport when it mounts is shown instantly so nothing
 * the visitor can see is held hostage by an animation.
 */
export function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const entering = entries.filter((entry) => entry.isIntersecting);
        entering.forEach((entry, index) => {
          const el = entry.target as HTMLElement;
          el.style.setProperty("--reveal-delay", `${Math.min(index * STAGGER_MS, STAGGER_CAP_MS)}ms`);
          el.classList.add("is-visible");
          io.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -15% 0px" }
    );

    const seen = new WeakSet<Element>();

    const register = (el: HTMLElement) => {
      if (seen.has(el)) return;
      seen.add(el);
      if (el.classList.contains("is-visible")) return;

      const rect = el.getBoundingClientRect();
      const alreadyOnScreen = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
      if (alreadyOnScreen) {
        el.classList.add("is-immediate", "is-visible");
        return;
      }
      io.observe(el);
    };

    const scan = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>(SELECTOR).forEach(register);
    };

    scan(document);

    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(SELECTOR)) register(node);
          scan(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}
