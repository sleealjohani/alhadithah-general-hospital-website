import { useEffect, useState } from "react";
import { fetchPublishedContent, mapRowToItem } from "../lib/supabase/content";
import type { PortalItem } from "../types";

export function usePublishedItems(table: string, fallback: PortalItem[]) {
  const [items, setItems] = useState(fallback);

  useEffect(() => {
    let active = true;
    fetchPublishedContent(table).then((rows) => {
      if (active && rows.length > 0) setItems(rows.map(mapRowToItem));
    });
    return () => {
      active = false;
    };
  }, [fallback, table]);

  return items;
}
