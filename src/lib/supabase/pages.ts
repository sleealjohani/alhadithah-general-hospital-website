import { supabase } from "./client";

export type CmsPageRow = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  excerpt_ar: string | null;
  excerpt_en: string | null;
  content_ar: string | null;
  content_en: string | null;
  seo_title_ar: string | null;
  seo_title_en: string | null;
  seo_description_ar: string | null;
  seo_description_en: string | null;
  og_image_url: string | null;
};

export type FetchPageResult =
  | { status: "found"; page: CmsPageRow }
  | { status: "missing" }
  | { status: "error" };

/* "missing" and "error" must stay distinct: missing renders a 404, while a
   network/database failure renders a retry state instead of lying that the
   page doesn't exist. */
export async function fetchPageBySlug(slug: string): Promise<FetchPageResult> {
  if (!supabase) return { status: "missing" };

  const { data, error } = await supabase
    .from("pages")
    .select(
      "id,slug,title_ar,title_en,excerpt_ar,excerpt_en,content_ar,content_en,seo_title_ar,seo_title_en,seo_description_ar,seo_description_en,og_image_url"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) return { status: "error" };
  if (!data) return { status: "missing" };
  return { status: "found", page: data as CmsPageRow };
}
