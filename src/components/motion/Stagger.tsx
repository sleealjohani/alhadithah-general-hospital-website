import { Children, type ReactNode } from "react";
import { m, type Variants } from "motion/react";
import { distances, durations, easings, revealViewportMargin, sec, stagger } from "../../lib/motion";
import { useReducedMotionPref } from "../../hooks/useReducedMotionPref";
import { MotionRoot } from "./MotionProvider";

type StaggerProps = {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
};

/**
 * Orchestrates children entering with a 60ms stagger, capped so the total
 * sweep never exceeds half a second regardless of list length. Each child is
 * wrapped in a plain div, so inside a grid the wrappers become the items.
 */
export function Stagger({ children, className, itemClassName }: StaggerProps) {
  const reduced = useReducedMotionPref();
  const count = Children.count(children);
  const step = count > 1 ? Math.min(stagger.interval, stagger.totalCap / (count - 1)) : 0;

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduced ? 0 : step } }
  };

  const item: Variants = reduced
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: distances.small },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: sec(durations.slow), ease: easings.decelerate }
        }
      };

  return (
    <MotionRoot>
      <m.div
        className={className}
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: revealViewportMargin }}
      >
        {Children.map(children, (child) => (
          <m.div className={itemClassName} variants={item}>
            {child}
          </m.div>
        ))}
      </m.div>
    </MotionRoot>
  );
}
