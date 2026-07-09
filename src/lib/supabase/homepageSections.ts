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
