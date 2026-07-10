import { tx } from "../../utils/i18n";
import type { PortalItem, PublicContentRow } from "../../types";
import { supabase } from "./client";

export async function fetchPublishedContent(table: string): Promise<PublicContentRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as PublicContentRow[];
}

export function mapRowToItem(row: PublicContentRow): PortalItem {
  return {
    id: row.id,
    title: tx(row.title_ar, row.title_en || row.title_ar),
    description: tx(row.description_ar || "", row.description_en || row.description_ar || ""),
    category: tx(row.category_ar || "عام", row.category_en || row.category_ar || "General"),
    icon: row.icon || "FileText",
    path: row.path || undefined,
    url: row.url || undefined,
    image: row.metadata?.image_url || undefined,
    status: row.status === "published" ? "published" : "draft",
    updatedAt: row.updated_at || row.created_at || undefined
  };
}
