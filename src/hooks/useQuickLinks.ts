import { useEffect, useState } from "react";
import { fetchQuickLinks } from "../lib/supabase/quickLinks";
import { quickAccess as staticQuickLinks } from "../data/content";
import type { PortalItem } from "../types";

function mergeQuickLinks(fallback: PortalItem[], live: PortalItem[]) {
  const merged = new Map<string, PortalItem>();
  const keyFor = (item: PortalItem) => item.path || item.url || item.title.en || item.id;
  for (const item of fallback) merged.set(keyFor(item), item);
  for (const item of live) merged.set(keyFor(item), item);
  return Array.from(merged.values());
}

export function useQuickLinks() {
  const [items, setItems] = useState<PortalItem[]>(staticQuickLinks);

  useEffect(() => {
    let active = true;
    fetchQuickLinks().then((rows) => {
      if (active && rows.length > 0) setItems(mergeQuickLinks(staticQuickLinks, rows));
    });
    return () => {
      active = false;
    };
  }, []);

  return items;
}
