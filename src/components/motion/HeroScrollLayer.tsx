import type { ReactNode } from "react";
import { m, useScroll, useTransform } from "motion/react";
import { MotionRoot } from "./MotionProvider";

/**
 * Scroll-linked hero layer: as the visitor scrolls through the hero, the
 * content gently lifts and fades (or drifts down, for a parallax counter-layer)
 * — a light "scrollytelling" depth without pinning the section. Pure transform
 * + opacity, driven by window scroll.
 */
export function HeroScrollLayer({
  children,
  className = "",
  parallax = false
}: {
  children: ReactNode;
  className?: string;
  parallax?: boolean;
}) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 640], [0, parallax ? 64 : -80]);
  const opacity = useTransform(scrollY, [0, 300, 520], parallax ? [1, 1, 1] : [1, 1, 0]);

  return (
    <MotionRoot>
      <m.div className={className} style={{ y, opacity }}>
        {children}
      </m.div>
    </MotionRoot>
  );
}
