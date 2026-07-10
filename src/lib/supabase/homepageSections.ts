import { supabase } from "./client";

type HomepageSectionRow = {
  section_key: string;
  is_active: boolean;
};

export async function fetchHomepageSectionVisibility(): Promise<Record<string, boolean>> {
  if (!supabase) return {};

  const { data, error } = await supabase.from("homepage_sections").select("section_key,is_active");
  if (error || !data) return {};

  const map: Record<string, boolean> = {};
  for (const row of data as HomepageSectionRow[]) {
    map[row.section_key] = row.is_active;
  }
  return map;
}

/* --- Full builder model -------------------------------------------------- */

export type HomeSectionType = "rich" | "cards";

export type HomeCard = {
  image_url?: string;
  title_ar?: string;
  title_en?: string;
  description_ar?: string;
  description_en?: string;
  url?: string;
};

export type HomeSectionContent = {
  type?: HomeSectionType;
  body_ar?: string;
  body_en?: string;
  image_url?: string;
  button_label_ar?: string;
  button_label_en?: string;
  button_url?: string;
  cards?: HomeCard[];
};

export type HomeSection = {
  id: string;
  section_key: string;
  title_ar: string | null;
  title_en: string | null;
  subtitle_ar: string | null;
  subtitle_en: string | null;
  content: HomeSectionContent;
  is_active: boolean;
  sort_order: number;
};

/** Every builder section (any type), ordered — used by the admin screen. */
export async function fetchAllHomeSections(): Promise<HomeSection[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("homepage_sections")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data as HomeSection[];
}

/** Only active sections the public renderer knows how to draw. */
export async function fetchPublicHomeSections(): Promise<HomeSection[]> {
  const all = await fetchAllHomeSections();
  return all.filter(
    (section) => section.is_active && (section.content?.type === "rich" || section.content?.type === "cards")
  );
}
