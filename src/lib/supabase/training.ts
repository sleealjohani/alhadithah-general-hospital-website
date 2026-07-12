import { supabase } from "./client";

export type CourseAudience = "employees" | "public" | "both";

export type TrainingCourse = {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  lecturer_ar: string | null;
  lecturer_en: string | null;
  poster_url: string | null;
  audience: CourseAudience;
  location_ar: string | null;
  location_en: string | null;
  starts_at: string | null;
  ends_at: string | null;
  capacity: number | null;
  register_url: string | null;
  status: "draft" | "published" | "archived";
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at?: string;
};

export type TrainingMedia = {
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

export type TrainingRegistration = {
  id: string;
  course_id: string | null;
  course_title: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  national_id: string | null;
  job_title: string | null;
  audience: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

export type TrainingHostRequest = {
  id: string;
  lecturers: string;
  course_name: string;
  duration: string | null;
  audience: string | null;
  phone: string;
  email: string | null;
  preferred_date: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

/* ---- Public reads ------------------------------------------------------- */

export async function fetchPublishedCourses(): Promise<TrainingCourse[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("training_courses")
    .select("*")
    .eq("status", "published")
    .order("starts_at", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []) as TrainingCourse[];
}

export async function fetchPublishedMedia(): Promise<TrainingMedia[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("training_media")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as TrainingMedia[];
}

/* ---- Public writes ------------------------------------------------------ */

export async function submitRegistration(
  payload: Omit<TrainingRegistration, "id" | "status" | "created_at">
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "not_configured" };
  const { error } = await supabase.from("training_registrations").insert(payload);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function submitHostRequest(
  payload: Omit<TrainingHostRequest, "id" | "status" | "created_at">
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "not_configured" };
  const { error } = await supabase.from("training_host_requests").insert(payload);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/* ---- Admin reads / writes ----------------------------------------------- */

export async function fetchAllCourses(): Promise<TrainingCourse[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("training_courses")
    .select("*")
    .order("starts_at", { ascending: false, nullsFirst: false })
    .order("sort_order", { ascending: true });
  return (data ?? []) as TrainingCourse[];
}

export async function upsertCourse(course: Partial<TrainingCourse>): Promise<{ error?: string }> {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("training_courses").upsert(course, { onConflict: "id" });
  return { error: error?.message };
}

export async function deleteCourse(id: string): Promise<{ error?: string }> {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("training_courses").delete().eq("id", id);
  return { error: error?.message };
}

export async function fetchAllMedia(): Promise<TrainingMedia[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("training_media")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  return (data ?? []) as TrainingMedia[];
}

export async function upsertMedia(media: Partial<TrainingMedia>): Promise<{ error?: string }> {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("training_media").upsert(media, { onConflict: "id" });
  return { error: error?.message };
}

export async function deleteMedia(id: string): Promise<{ error?: string }> {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("training_media").delete().eq("id", id);
  return { error: error?.message };
}

export async function fetchRegistrations(): Promise<TrainingRegistration[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("training_registrations")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as TrainingRegistration[];
}

export async function fetchHostRequests(): Promise<TrainingHostRequest[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("training_host_requests")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as TrainingHostRequest[];
}

export async function updateHostRequestStatus(id: string, status: string): Promise<{ error?: string }> {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("training_host_requests").update({ status }).eq("id", id);
  return { error: error?.message };
}

export async function updateRegistrationStatus(id: string, status: string): Promise<{ error?: string }> {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("training_registrations").update({ status }).eq("id", id);
  return { error: error?.message };
}
