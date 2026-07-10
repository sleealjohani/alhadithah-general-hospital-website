import { useEffect, useState } from "react";
import { fetchPublishedContent, mapRowToItem } from "../lib/supabase/content";
import type { PortalItem } from "../types";

function mergePortalItems(fallback: PortalItem[], live: PortalItem[]) {
  const merged = new Map<string, PortalItem>();
  const keyFor = (item: PortalItem) => item.id || item.path || item.url || item.title.en;
  for (const item of fallback) merged.set(keyFor(item), item);
  for (const item of live) merged.set(keyFor(item), item);
  return Array.from(merged.values());
}

export function usePublishedItems(table: string, fallback: PortalItem[]) {
  const [items, setItems] = useState(fallback);

  useEffect(() => {
    let active = true;
    fetchPublishedContent(table).then((rows) => {
      if (active && rows.length > 0) setItems(mergePortalItems(fallback, rows.map(mapRowToItem)));
    });
    return () => {
      active = false;
    };
  }, [fallback, table]);

  return items;
}
