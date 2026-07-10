import type { ReactNode } from "react";
import { LazyMotion } from "motion/react";

/* Every motion primitive wraps its own subtree in MotionRoot instead of the
   app mounting one global provider: all m.* consumers live in lazy route
   chunks, so this keeps the motion runtime out of the critical bundle
   entirely. The feature bundle stays async and is shared across instances.
   `strict` guarantees nobody imports the full `motion.*` components and
   silently drags the whole library back in — always use `m.*`. */
const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
