import { type ElementType } from "react";
import { m, type Variants } from "motion/react";
import { MotionRoot } from "./MotionProvider";

type RevealTextProps = {
  /** Already-localized text to animate. */
  text: string;
  /** Rendered wrapper element (h1, h2, span…). Defaults to span. */
  as?: ElementType;
  className?: string;
  /** Play on mount instead of on scroll-into-view (for above-the-fold heroes). */
  immediate?: boolean;
};

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.02 } }
};

const word: Variants = {
  hidden: { y: "115%" },
  visible: { y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};

/**
 * Editorial heading reveal: each word rises out of a clip mask in sequence
 * when the heading scrolls into view (once). Words are laid out in normal
 * inline flow, so it reads correctly in both LTR and RTL.
 */
export function RevealText({ text, as: Tag = "span", className, immediate = false }: RevealTextProps) {
  const words = text.split(" ");
  const trigger = immediate
    ? ({ animate: "visible" } as const)
    : ({ whileInView: "visible", viewport: { once: true, margin: "0px 0px -12% 0px" } } as const);
  return (
    <MotionRoot>
      <Tag className={className}>
        <m.span className="reveal-text" variants={container} initial="hidden" {...trigger}>
          {words.map((entry, index) => (
            <span className="reveal-word" key={`${entry}-${index}`}>
              <m.span className="reveal-word-inner" variants={word}>
                {entry}
              </m.span>
              {index < words.length - 1 ? " " : ""}
            </span>
          ))}
        </m.span>
      </Tag>
    </MotionRoot>
  );
}
