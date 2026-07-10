/* Central motion vocabulary. Every animation — JS or CSS — derives from these
   values; the CSS mirror lives in styles/tokens.css (--duration-*, --ease-*,
   --distance-*). Change them together. */

/** Durations in milliseconds. Framer transitions want seconds — use `sec()`. */
export const durations = {
  instant: 100,
  fast: 150,
  base: 250,
  slow: 400,
  slower: 600
} as const;

export function sec(ms: number): number {
  return ms / 1000;
}

/** Cubic-bezier control points, in the array form framer-motion accepts. */
export const easings = {
  /** Most UI transitions. */
  standard: [0.2, 0, 0, 1] as [number, number, number, number],
  /** Elements entering the screen. */
  decelerate: [0, 0, 0, 1] as [number, number, number, number],
  /** Elements exiting the screen. */
  accelerate: [0.3, 0, 1, 1] as [number, number, number, number]
};

export const easingsCss = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  decelerate: "cubic-bezier(0, 0, 0, 1)",
  accelerate: "cubic-bezier(0.3, 0, 1, 1)"
} as const;

/** Gestural / physical motion (toggles, sheets, magnetic elements). */
export const springs = {
  spring: { type: "spring", stiffness: 260, damping: 30, mass: 1 } as const,
  springSoft: { type: "spring", stiffness: 120, damping: 20 } as const
};

/** Translation distances in px. Only ever animate transform with these. */
export const distances = {
  subtle: 4,
  small: 8,
  medium: 16,
  large: 32
} as const;

/** Ready-made framer transitions for the three canonical cases. */
export const transitions = {
  standard: { duration: sec(durations.base), ease: easings.standard },
  enter: { duration: sec(durations.slow), ease: easings.decelerate },
  exit: { duration: sec(durations.fast), ease: easings.accelerate }
} as const;

/** Viewport margin used by every scroll-reveal trigger. */
export const revealViewportMargin = "0px 0px -15% 0px" as const;

/** Stagger interval and the cap that keeps long lists from dragging on. */
export const stagger = {
  interval: 0.06,
  totalCap: 0.5
} as const;
