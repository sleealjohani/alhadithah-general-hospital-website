import { useEffect } from "react";

export function useScrollReveal() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!items.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -60px 0px" }
    );

    items.forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${Math.min(index * 55, 280)}ms`);
      observer.observe(item);
    });

    return () => observer.disconnect();
  });
}
