import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
