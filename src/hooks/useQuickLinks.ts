import { useEffect, useState } from "react";
import { fetchQuickLinks } from "../lib/supabase/quickLinks";
import { quickAccess as staticQuickLinks } from "../data/content";
import type { PortalItem } from "../types";

export function useQuickLinks() {
  const [items, setItems] = useState<PortalItem[]>(staticQuickLinks);

  useEffect(() => {
    let active = true;
    fetchQuickLinks().then((rows) => {
      if (active && rows.length > 0) setItems(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  return items;
}
