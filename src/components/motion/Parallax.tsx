import { type ReactNode, useRef } from "react";
import { m, useScroll, useTransform } from "motion/react";
import { useReducedMotionPref } from "../../hooks/useReducedMotionPref";
import { MotionRoot } from "./MotionProvider";

type ParallaxProps = {
  children: ReactNode;
  className?: string;
  /** 0–1; fraction of scroll delta the element drifts. Clamped internally. */
  speed?: number;
};

/**
 * Gentle scroll-linked drift for imagery and decorative panels only — never
 * put text in here. The range is clamped to ±48px and the whole effect is
 * inert under reduced motion.
 */
export function Parallax({ children, className, speed = 0.2 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPref();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const max = Math.min(Math.abs(speed) * 120, 48);
  const y = useTransform(scrollYProgress, [0, 1], [max, -max]);

  return (
    <MotionRoot>
      <m.div ref={ref} className={className} style={reduced ? undefined : { y }}>
        {children}
      </m.div>
    </MotionRoot>
  );
}
