import { type ReactNode, useRef } from "react";
import { m, useMotionValue, useSpring } from "motion/react";
import { useReducedMotionPref } from "../../hooks/useReducedMotionPref";
import { MotionRoot } from "./MotionProvider";

type MagneticProps = {
  children: ReactNode;
  className?: string;
  /** Max pull toward the cursor, in px. Keep it subtle. */
  strength?: number;
};

/**
 * Wraps an interactive element so it drifts toward the pointer on hover and
 * springs back on leave — a tactile, premium "magnetic" feel. Pure transform,
 * so it stays on the compositor. Under reduced motion it renders a plain span
 * with no listeners and never moves.
 */
export function Magnetic({ children, className, strength = 20 }: MagneticProps) {
  const reduced = useReducedMotionPref();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.6 });

  if (reduced) {
    return <span className={className}>{children}</span>;
  }

  const onMove = (event: React.PointerEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = event.clientX - (rect.left + rect.width / 2);
    const relY = event.clientY - (rect.top + rect.height / 2);
    const clamp = (value: number, extent: number) =>
      Math.max(-strength, Math.min(strength, (value / (extent / 2)) * strength));
    x.set(clamp(relX, rect.width));
    y.set(clamp(relY, rect.height));
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <MotionRoot>
      <m.span
        ref={ref}
        className={className}
        style={{ x: sx, y: sy, display: "inline-flex" }}
        onPointerMove={onMove}
        onPointerLeave={reset}
      >
        {children}
      </m.span>
    </MotionRoot>
  );
}
