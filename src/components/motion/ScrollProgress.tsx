import { m, useScroll, useSpring } from "motion/react";
import { useReducedMotionPref } from "../../hooks/useReducedMotionPref";
import { MotionRoot } from "./MotionProvider";

/**
 * Reading-progress bar pinned to the top edge. Pure transform (scaleX), so it
 * stays on the compositor; the transform origin flips for RTL in CSS. Under
 * reduced motion the bar still reports progress but without spring smoothing.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const reduced = useReducedMotionPref();
  const smoothed = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });

  return (
    <MotionRoot>
      <m.div
        className="scroll-progress"
        aria-hidden="true"
        style={{ scaleX: reduced ? scrollYProgress : smoothed }}
      />
    </MotionRoot>
  );
}
