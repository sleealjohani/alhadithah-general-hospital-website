/* Thin, vendor-neutral analytics seam. Events queue into a dataLayer-style
   array; wiring a real vendor later means draining window.__hadethaEvents
   without touching call sites. No SDK is loaded here by design. */

type EventProps = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    __hadethaEvents?: Array<{ event: string; props?: EventProps; at: string }>;
  }
}

export function track(event: string, props?: EventProps) {
  const queue = (window.__hadethaEvents ||= []);
  queue.push({ event, props, at: new Date().toISOString() });
  if (queue.length > 200) queue.shift();
  if (import.meta.env.DEV) console.debug("[track]", event, props ?? {});
}
