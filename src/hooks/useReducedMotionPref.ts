/**
 * Motion is always on across the site — the reduce-motion control was removed,
 * so this always reports false. Kept as a hook so the motion primitives that
 * consult it keep a single, stable import.
 */
export function useReducedMotionPref(): boolean {
  return false;
}
