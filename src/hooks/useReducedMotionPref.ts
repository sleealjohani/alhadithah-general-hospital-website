import { useSyncExternalStore } from "react";
import { usePortal } from "../providers/PortalProvider";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/**
 * The single reduced-motion source of truth: true when either the OS asks for
 * it or the visitor toggled it in the accessibility panel. Components with JS
 * driven motion must consult this; pure-CSS motion is silenced globally by the
 * [data-motion="reduced"] rules in base.css.
 */
export function useReducedMotionPref(): boolean {
  const osPrefers = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const { reduceMotion } = usePortal();
  return osPrefers || reduceMotion;
}
