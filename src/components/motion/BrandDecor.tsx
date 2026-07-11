import { m, useScroll, useTransform } from "motion/react";
import { useReducedMotionPref } from "../../hooks/useReducedMotionPref";
import { MotionRoot } from "./MotionProvider";

/**
 * The Aljouf star mark as a large, faint background watermark that reacts to
 * page scroll — it drifts up, rotates a touch, and scales as the visitor
 * scrolls, layered under content. A slow CSS float (see design-system.css)
 * keeps it alive even at rest. Decorative only (aria-hidden); under reduced
 * motion it renders a static image with no scroll binding.
 */
export function BrandWatermark({ src, className = "" }: { src: string; className?: string }) {
  const reduced = useReducedMotionPref();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 900], [0, -150]);
  const rotate = useTransform(scrollY, [0, 900], [0, 26]);
  const scale = useTransform(scrollY, [0, 900], [1, 1.14]);

  if (reduced) {
    return <img className={`brand-watermark ${className}`} src={src} alt="" aria-hidden="true" />;
  }

  return (
    <MotionRoot>
      <m.img
        className={`brand-watermark ${className}`}
        src={src}
        alt=""
        aria-hidden="true"
        style={{ y, rotate, scale }}
      />
    </MotionRoot>
  );
}

/**
 * The brand wave motif as a decorative band. The outer track parallaxes
 * horizontally with scroll; the inner layer runs a slow, continuous drift so
 * the wave is always subtly moving — the signature "expensive" flourish.
 * Decorative only; static under reduced motion.
 */
export function BrandWave({ src, className = "" }: { src: string; className?: string }) {
  const reduced = useReducedMotionPref();
  const { scrollY } = useScroll();
  const x = useTransform(scrollY, [0, 1400], [0, -120]);

  const inner = (
    <span className="brand-wave-layer" style={{ backgroundImage: `url(${src})` }} aria-hidden="true" />
  );

  if (reduced) {
    return <span className={`brand-wave ${className}`}>{inner}</span>;
  }

  return (
    <MotionRoot>
      <m.span className={`brand-wave ${className}`} style={{ x }} aria-hidden="true">
        {inner}
      </m.span>
    </MotionRoot>
  );
}
