import { useEffect, useState } from "react";
import { fetchNavigationItems } from "../lib/supabase/navigation";
import { defaultHeaderNavigationMenu } from "../constants/publicNavigation";
import type { NavMenuItem } from "../types";

const staticFallback: NavMenuItem[] = defaultHeaderNavigationMenu;

function mergeNavigationItems(fallback: NavMenuItem[], live: NavMenuItem[]) {
  const order = new Map<string, number>();
  const merged = new Map<string, NavMenuItem>();
  const keyFor = (item: NavMenuItem) => item.path || item.url || item.label.en;

  [...fallback, ...live].forEach((item, index) => {
    const key = keyFor(item);
    if (!order.has(key)) order.set(key, index);
    merged.set(key, item);
  });

  return Array.from(merged.entries())
    .sort((a, b) => {
      const aOrder = a[1].sortOrder ?? order.get(a[0]) ?? 0;
      const bOrder = b[1].sortOrder ?? order.get(b[0]) ?? 0;
      return aOrder - bOrder;
    })
    .map(([, item]) => item);
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
