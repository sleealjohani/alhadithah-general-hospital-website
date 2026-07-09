import { tx } from "../../utils/i18n";
import type { PortalItem } from "../../types";
import { supabase } from "./client";

type QuickLinkRow = {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  icon: string | null;
  path: string | null;
  url: string | null;
  audience: string;
};

const audienceLabel: Record<string, ReturnType<typeof tx>> = {
  public: tx("عام", "Public"),
  employee: tx("داخلي", "Internal"),
  admin: tx("إدارة", "Admin"),
  all: tx("للجميع", "For everyone")
};

export async function fetchQuickLinks(): Promise<PortalItem[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("quick_links")
    .select("id,title_ar,title_en,description_ar,description_en,icon,path,url,audience")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  return (data as QuickLinkRow[]).map((row) => ({
    id: row.id,
    title: tx(row.title_ar, row.title_en),
    description: tx(row.description_ar || "", row.description_en || ""),
    category: audienceLabel[row.audience] || audienceLabel.public,
    icon: row.icon || "ExternalLink",
    path: row.path || undefined,
    url: row.url || undefined,
    audience: (["public", "employee", "admin", "all"].includes(row.audience) ? row.audience : "public") as PortalItem["audience"]
  }));
}
