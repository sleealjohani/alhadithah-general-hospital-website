import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { m } from "motion/react";
import { distances, durations, easings, revealViewportMargin, sec } from "../../lib/motion";
import { useReducedMotionPref } from "../../hooks/useReducedMotionPref";
import { MotionRoot } from "./MotionProvider";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Extra delay in seconds, e.g. to offset siblings. Keep under 0.4s. */
  delay?: number;
  distance?: number;
};

/**
 * Fades + translates content in on first viewport entry. Fires once, never
 * on scroll-up. Content already on screen when it mounts renders instantly —
 * above-the-fold copy is never held back by an entrance animation.
 */
export function Reveal({ children, className, delay = 0, distance = distances.medium }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPref();
  const [mode, setMode] = useState<"pending" | "animate" | "static">("pending");

  useLayoutEffect(() => {
    if (reduced) {
      setMode("static");
      return;
    }
    const el = ref.current;
    if (!el) {
      setMode("static");
      return;
    }
    const rect = el.getBoundingClientRect();
    const onScreen = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    setMode(onScreen ? "static" : "animate");
  }, [reduced]);

  return (
    <MotionRoot>
      <m.div
        ref={ref}
        className={className}
        initial={{ opacity: 0, y: distance }}
        animate={mode === "static" ? { opacity: 1, y: 0, transition: { duration: 0 } } : undefined}
        whileInView={mode === "animate" ? { opacity: 1, y: 0 } : undefined}
        viewport={{ once: true, margin: revealViewportMargin }}
        transition={{ duration: sec(durations.slower), ease: easings.decelerate, delay }}
      >
        {children}
      </m.div>
    </MotionRoot>
  );
}
