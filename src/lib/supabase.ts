import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

const defaultSupabaseUrl = "https://ihoghgaljgcwitxiywyo.supabase.co";
const defaultSupabaseKey = "sb_publishable_iYpt-Qh_j_L-u2wkjK773w_JR41i-vt";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultSupabaseUrl;
export const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || defaultSupabaseKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export type AdminRole = "super_admin" | "admin" | "editor" | "reviewer" | "viewer";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AdminRole;
  status: "active" | "disabled";
  created_at: string;
};

export type AdminSession = {
  session: Session;
  profile: Profile;
};

export type PublicContentRow = {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  category_ar: string | null;
  category_en: string | null;
  icon: string | null;
  url: string | null;
  path: string | null;
  status: string | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export async function getCurrentAdminSession(): Promise<AdminSession | null> {
  if (!supabase) return null;

  const { data: authData, error: authError } = await supabase.auth.getSession();
  if (authError || !authData.session) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.session.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.status !== "active") return null;

  return {
    session: authData.session,
    profile: profile as Profile
  };
}

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
