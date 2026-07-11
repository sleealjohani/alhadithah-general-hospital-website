import { m, useScroll, useTransform } from "motion/react";
import { MotionRoot } from "./MotionProvider";

/**
 * The Aljouf star mark as a large, faint background watermark. The outer layer
 * reacts to page scroll — drifting up, rotating, and scaling — while the inner
 * image runs a slow continuous float, so the brand is always alive even at
 * rest. Decorative only (aria-hidden).
 */
export function BrandWatermark({ src, className = "" }: { src: string; className?: string }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 900], [0, -220]);
  const rotate = useTransform(scrollY, [0, 900], [0, 42]);
  const scale = useTransform(scrollY, [0, 1000], [1, 1.2]);

  return (
    <MotionRoot>
      <m.span className={`brand-watermark ${className}`} style={{ y, rotate, scale }} aria-hidden="true">
        <img className="brand-watermark-img" src={src} alt="" />
      </m.span>
    </MotionRoot>
  );
}

/**
 * The brand wave motif as a decorative band. The outer track parallaxes
 * horizontally with scroll; the inner layer runs a slow, continuous drift so
 * the wave is always subtly moving — the signature flourish. Decorative only.
 */
export function BrandWave({ src, className = "" }: { src: string; className?: string }) {
  const { scrollY } = useScroll();
  const x = useTransform(scrollY, [0, 1400], [0, -160]);

  return (
    <MotionRoot>
      <m.span className={`brand-wave ${className}`} style={{ x }} aria-hidden="true">
        <span className="brand-wave-layer" style={{ backgroundImage: `url(${src})` }} aria-hidden="true" />
      </m.span>
    </MotionRoot>
  );
}
