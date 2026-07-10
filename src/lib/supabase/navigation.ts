import { tx } from "../../utils/i18n";
import type { NavMenuItem } from "../../types";
import { supabase } from "./client";

type NavigationRow = {
  label_ar: string;
  label_en: string;
  path: string | null;
  url: string | null;
  icon: string | null;
  sort_order: number | null;
};

export async function fetchNavigationItems(location: "header" | "footer" | "quick"): Promise<NavMenuItem[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("navigation_items")
    .select("label_ar,label_en,path,url,icon,sort_order")
    .eq("location", location)
    .eq("is_active", true)
    .is("parent_id", null)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  return (data as NavigationRow[]).map((row) => ({
    path: row.path || undefined,
    url: row.url || undefined,
    label: tx(row.label_ar, row.label_en),
    icon: row.icon || undefined,
    sortOrder: row.sort_order ?? undefined
  }));
}
