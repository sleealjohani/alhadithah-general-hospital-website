import { supabase } from "./client";

/* ---- Types -------------------------------------------------------------- */

export type NursingStaffSelf = {
  id: string;
  employee_number: string;
  full_name: string;
  specialty: string | null;
  department: string | null;
  phone: string | null;
  email: string | null;
  gender: string | null;
  qualification: string | null;
  nationality: string | null;
  hire_date: string | null;
  employer: string | null;
  is_manager: boolean;
  has_pin: boolean;
};

export type VacationPlan = {
  id: string;
  start_date: string;
  end_date: string;
  days: number | null;
  notes: string | null;
  status: "submitted" | "approved" | "returned" | "cancelled";
  manager_note: string | null;
  created_at: string;
  staff_id?: string;
};

export type ProfileItem = {
  id: string;
  kind: "certificate" | "license" | "competency" | "health_certificate" | "bls" | "acls" | "other";
  title: string;
  issuer: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  file_url: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  staff_id?: string;
};

export type NursingPolicy = {
  id: string;
  title_ar: string;
  title_en: string;
  category_ar: string | null;
  category_en: string | null;
  body_ar: string | null;
  body_en: string | null;
  file_url: string | null;
  status: "draft" | "published" | "archived";
  sort_order: number;
};

export type NursingMedia = {
  id: string;
  title_ar: string | null;
  title_en: string | null;
  media_url: string;
  media_type: "image" | "video";
  caption_ar: string | null;
  caption_en: string | null;
  status: "draft" | "published" | "archived";
  sort_order: number;
};

export type NursingSpotlight = {
  id: string;
  photo_url: string | null;
  name: string;
  specialty: string | null;
  month_label_ar: string | null;
  month_label_en: string | null;
  message_ar: string | null;
  message_en: string | null;
  achievements_ar: string | null;
  achievements_en: string | null;
  is_active: boolean;
};

export type NursingStaffAdmin = NursingStaffSelf & {
  national_id: string | null;
  program_type: string | null;
  staffing_entity: string | null;
  birth_date: string | null;
  notes: string | null;
  is_active: boolean;
};

export type ManagerOverview = {
  status: string;
  staff: Array<{ id: string; employee_number: string; full_name: string; specialty: string | null; department: string | null; phone: string | null; is_active: boolean }>;
  expiring: Array<{ staff: string; department: string | null; kind: string; title: string; expiry_date: string }>;
  pending_vacations: number;
  pending_profile: number;
};

/* ---- Session token ------------------------------------------------------ */

const TOKEN_KEY = "nursing_token";
export const getNursingToken = () => localStorage.getItem(TOKEN_KEY) || "";
export const setNursingToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearNursingToken = () => localStorage.removeItem(TOKEN_KEY);

async function rpc<T = any>(fn: string, args: Record<string, unknown>): Promise<T | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc(fn, args);
  if (error) return { status: "error", message: error.message } as unknown as T;
  return data as T;
}

/* ---- Public reads ------------------------------------------------------- */

export async function fetchNursingMedia(): Promise<NursingMedia[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("nursing_media")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  return (data ?? []) as NursingMedia[];
}

export async function fetchActiveSpotlight(): Promise<NursingSpotlight | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("nursing_spotlight")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as NursingSpotlight) ?? null;
}

export async function fetchPublishedPolicies(): Promise<NursingPolicy[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("nursing_policies")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  return (data ?? []) as NursingPolicy[];
}

/* ---- Staff auth + self-service (RPCs) ----------------------------------- */

export const nursingLookup = (emp: string) =>
  rpc<{ status: string; has_pin?: boolean; full_name?: string }>("nursing_lookup", { p_emp: emp });

export const nursingSetPin = (emp: string, pin: string) =>
  rpc<{ status: string; token?: string; staff?: NursingStaffSelf }>("nursing_set_pin", { p_emp: emp, p_pin: pin });

export const nursingSignIn = (emp: string, pin: string) =>
  rpc<{ status: string; token?: string; staff?: NursingStaffSelf }>("nursing_sign_in", { p_emp: emp, p_pin: pin });

export const nursingMe = (token: string) =>
  rpc<{ status: string; staff?: NursingStaffSelf; vacations?: VacationPlan[]; profile?: ProfileItem[] }>("nursing_me", {
    p_token: token
  });

export const nursingSubmitVacation = (token: string, start: string, end: string, notes: string) =>
  rpc<{ status: string }>("nursing_submit_vacation", { p_token: token, p_start: start, p_end: end, p_notes: notes });

export const nursingAddProfileItem = (
  token: string,
  item: { kind: string; title: string; issuer?: string; issued?: string | null; expiry?: string | null; file?: string | null }
) =>
  rpc<{ status: string }>("nursing_add_profile_item", {
    p_token: token,
    p_kind: item.kind,
    p_title: item.title,
    p_issuer: item.issuer ?? null,
    p_issued: item.issued ?? null,
    p_expiry: item.expiry ?? null,
    p_file: item.file ?? null
  });

export const nursingManagerOverview = (token: string) =>
  rpc<ManagerOverview>("nursing_manager_overview", { p_token: token });

/* ---- Admin (direct tables, guarded by admin RLS) ------------------------ */

export async function adminFetchStaff(): Promise<NursingStaffAdmin[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("nursing_staff").select("*").order("full_name");
  return (data ?? []) as NursingStaffAdmin[];
}
export async function adminUpsertStaff(row: Partial<NursingStaffAdmin>) {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("nursing_staff").upsert(row, { onConflict: "id" });
  return { error: error?.message };
}
export async function adminSetManager(id: string, is_manager: boolean) {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("nursing_staff").update({ is_manager }).eq("id", id);
  return { error: error?.message };
}
export async function adminResetPin(id: string) {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("nursing_staff").update({ pin_hash: null }).eq("id", id);
  return { error: error?.message };
}

export async function adminFetchPolicies(): Promise<NursingPolicy[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("nursing_policies").select("*").order("sort_order");
  return (data ?? []) as NursingPolicy[];
}
export async function adminUpsertPolicy(row: Partial<NursingPolicy>) {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("nursing_policies").upsert(row, { onConflict: "id" });
  return { error: error?.message };
}
export async function adminDeletePolicy(id: string) {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("nursing_policies").delete().eq("id", id);
  return { error: error?.message };
}

export async function adminFetchMedia(): Promise<NursingMedia[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("nursing_media").select("*").order("sort_order");
  return (data ?? []) as NursingMedia[];
}
export async function adminUpsertMedia(row: Partial<NursingMedia>) {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("nursing_media").upsert(row, { onConflict: "id" });
  return { error: error?.message };
}
export async function adminDeleteMedia(id: string) {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("nursing_media").delete().eq("id", id);
  return { error: error?.message };
}
export async function adminSetMediaStatus(id: string, status: "published" | "draft" | "archived") {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("nursing_media").update({ status }).eq("id", id);
  return { error: error?.message };
}

export async function adminFetchSpotlight(): Promise<NursingSpotlight[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("nursing_spotlight").select("*").order("updated_at", { ascending: false });
  return (data ?? []) as NursingSpotlight[];
}
export async function adminUpsertSpotlight(row: Partial<NursingSpotlight>) {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("nursing_spotlight").upsert(row, { onConflict: "id" });
  return { error: error?.message };
}
export async function adminDeleteSpotlight(id: string) {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("nursing_spotlight").delete().eq("id", id);
  return { error: error?.message };
}

export async function adminFetchVacations(): Promise<VacationPlan[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("nursing_vacation_plans").select("*").order("created_at", { ascending: false });
  return (data ?? []) as VacationPlan[];
}
export async function adminSetVacationStatus(id: string, status: string, manager_note?: string) {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("nursing_vacation_plans").update({ status, manager_note: manager_note ?? null }).eq("id", id);
  return { error: error?.message };
}

export async function adminFetchProfileItems(): Promise<ProfileItem[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("nursing_profile_items").select("*").order("created_at", { ascending: false });
  return (data ?? []) as ProfileItem[];
}
export async function adminSetProfileStatus(id: string, status: string) {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("nursing_profile_items").update({ status }).eq("id", id);
  return { error: error?.message };
}
