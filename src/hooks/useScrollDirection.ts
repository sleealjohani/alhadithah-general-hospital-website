import { useEffect, useState } from "react";

/**
 * rAF-throttled scroll direction with a small threshold so it doesn't flap
 * on rubber-banding. Reports "up" near the top of the page so consumers
 * (the auto-hiding header) always show themselves there.
 */
export function useScrollDirection(threshold = 8, topZone = 96): "up" | "down" {
  const [direction, setDirection] = useState<"up" | "down">("up");

  useEffect(() => {
    let anchorY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = window.scrollY;
        if (y < topZone) {
          setDirection("up");
          anchorY = y;
          return;
        }
        const diff = y - anchorY;
        if (Math.abs(diff) < threshold) return;
        setDirection(diff > 0 ? "down" : "up");
        anchorY = y;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, topZone]);

  return direction;
}
