import { useEffect, useState } from "react";
import { fetchNavigationItems } from "../lib/supabase/navigation";
import { navItems as staticNavItems } from "../data/content";
import type { NavMenuItem } from "../types";

const staticFallback: NavMenuItem[] = staticNavItems.map((item) => ({ path: item.path, label: item.label }));

function mergeNavigationItems(fallback: NavMenuItem[], live: NavMenuItem[]) {
  const merged = new Map<string, NavMenuItem>();
  const keyFor = (item: NavMenuItem) => item.path || item.url || item.label.en;
  for (const item of fallback) merged.set(keyFor(item), item);
  for (const item of live) merged.set(keyFor(item), item);
  return Array.from(merged.values());
}

export function useNavigationItems(location: "header" | "footer" | "quick") {
  const [items, setItems] = useState<NavMenuItem[]>(location === "header" ? staticFallback : []);

  useEffect(() => {
    let active = true;
    fetchNavigationItems(location).then((rows) => {
      if (!active) return;
      if (rows.length > 0) {
        setItems(location === "header" ? mergeNavigationItems(staticFallback, rows) : rows);
      } else if (location === "header") {
        setItems(staticFallback);
      }
    });
    return () => {
      active = false;
    };
  }, [location]);

  return items;
}
