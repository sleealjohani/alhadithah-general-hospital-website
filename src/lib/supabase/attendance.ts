import { supabase } from "./client";
import type { TrainingCourse } from "./training";

/* ---- Types -------------------------------------------------------------- */

export type CertFieldKey = "name" | "employee_number" | "course" | "duration" | "date";

export type CertField = {
  enabled: boolean;
  x: number; // % of certificate width
  y: number; // % of certificate height
  size: number; // px at the reference width (1000px)
  color: string;
  weight: number;
  align: "start" | "center" | "end";
};

export type TrainingConfig = {
  open_before_min: number;
  hide_after_hours: number;
  cert_bg_url: string | null;
  cert_word_url: string | null;
  cert_fields: Partial<Record<CertFieldKey, CertField>>;
  questionnaire: Record<string, unknown>;
};

export type AttendanceRecord = {
  id: string;
  course_id: string;
  full_name: string;
  national_id: string | null;
  employee_number: string | null;
  checked_in_at: string;
  certificate_printed_at: string | null;
  feedback_overall: number | null;
  feedback_content: number | null;
  feedback_benefit: string | null;
  feedback_recommend: boolean | null;
  feedback_comment: string | null;
  feedback_at: string | null;
};

/* State of a course relative to "now" for the attendance QR flow. */
export type CourseState = "upcoming" | "open" | "ended" | "past";

export type CourseWindow = {
  state: CourseState;
  openAt: number | null;
  startAt: number | null;
  endAt: number | null;
  hideAt: number | null;
};

/* ---- Defaults ----------------------------------------------------------- */

export const DEFAULT_CONFIG: TrainingConfig = {
  open_before_min: 60,
  hide_after_hours: 3,
  cert_bg_url: null,
  cert_word_url: null,
  cert_fields: {},
  questionnaire: {}
};

/* Sensible starting positions over a landscape certificate (percentages). */
export const DEFAULT_CERT_FIELDS: Record<CertFieldKey, CertField> = {
  name: { enabled: true, x: 50, y: 46, size: 46, color: "#0e2841", weight: 700, align: "center" },
  employee_number: { enabled: true, x: 50, y: 56, size: 22, color: "#435a72", weight: 600, align: "center" },
  course: { enabled: true, x: 50, y: 66, size: 28, color: "#166b9b", weight: 700, align: "center" },
  duration: { enabled: true, x: 50, y: 74, size: 20, color: "#435a72", weight: 600, align: "center" },
  date: { enabled: true, x: 50, y: 86, size: 18, color: "#5c7186", weight: 600, align: "center" }
};

export function certField(config: TrainingConfig, key: CertFieldKey): CertField {
  return { ...DEFAULT_CERT_FIELDS[key], ...(config.cert_fields?.[key] ?? {}) };
}

/* ---- Reads -------------------------------------------------------------- */

export async function fetchTrainingConfig(): Promise<TrainingConfig> {
  if (!supabase) return { ...DEFAULT_CONFIG };
  const { data } = await supabase.from("training_config").select("*").eq("id", true).maybeSingle();
  if (!data) return { ...DEFAULT_CONFIG };
  return {
    open_before_min: data.open_before_min ?? 60,
    hide_after_hours: data.hide_after_hours ?? 3,
    cert_bg_url: data.cert_bg_url ?? null,
    cert_word_url: data.cert_word_url ?? null,
    cert_fields: (data.cert_fields ?? {}) as TrainingConfig["cert_fields"],
    questionnaire: (data.questionnaire ?? {}) as Record<string, unknown>
  };
}

/* ---- Window logic ------------------------------------------------------- */

/* End of a course: its ends_at, or start + 1h as a fallback. */
function courseEnd(course: TrainingCourse): number | null {
  if (course.ends_at) return new Date(course.ends_at).getTime();
  if (course.starts_at) return new Date(course.starts_at).getTime() + 60 * 60 * 1000;
  return null;
}

export function courseWindow(course: TrainingCourse, config: TrainingConfig, now = Date.now()): CourseWindow {
  const startAt = course.starts_at ? new Date(course.starts_at).getTime() : null;
  const endAt = courseEnd(course);
  if (startAt === null || endAt === null) {
    return { state: "upcoming", openAt: null, startAt, endAt, hideAt: null };
  }
  const openAt = startAt - config.open_before_min * 60 * 1000;
  const hideAt = endAt + config.hide_after_hours * 60 * 60 * 1000;
  let state: CourseState;
  if (now < openAt) state = "upcoming";
  else if (now < endAt) state = "open";
  else if (now < hideAt) state = "ended";
  else state = "past";
  return { state, openAt, startAt, endAt, hideAt };
}

/* Choose the course the QR should surface right now, plus what's coming up.
   Preference: a course currently in its attendance window ("open") wins over one
   that has just ended ("ended"); ties break on the sooner start. */
export function resolveAttendance(
  courses: TrainingCourse[],
  config: TrainingConfig,
  now = Date.now()
): { active: TrainingCourse | null; window: CourseWindow | null; upcoming: TrainingCourse[] } {
  const scored = courses
    .map((c) => ({ course: c, win: courseWindow(c, config, now) }))
    .filter((x) => x.win.startAt !== null);

  const live = scored
    .filter((x) => x.win.state === "open" || x.win.state === "ended")
    .sort((a, b) => {
      if (a.win.state !== b.win.state) return a.win.state === "open" ? -1 : 1;
      return (a.win.startAt ?? 0) - (b.win.startAt ?? 0);
    });

  const upcoming = scored
    .filter((x) => x.win.state === "upcoming")
    .sort((a, b) => (a.win.startAt ?? 0) - (b.win.startAt ?? 0))
    .map((x) => x.course);

  if (live[0]) return { active: live[0].course, window: live[0].win, upcoming };
  return { active: null, window: null, upcoming };
}

/* ---- Public writes (RPCs) ----------------------------------------------- */

export async function checkIn(courseId: string, name: string, national: string, emp: string) {
  if (!supabase) return { error: "not_configured" as const };
  const { data, error } = await supabase.rpc("training_check_in", {
    p_course: courseId,
    p_name: name,
    p_national: national,
    p_emp: emp
  });
  if (error) return { error: error.message };
  const res = data as { status: string; id?: string; message?: string };
  if (res.status !== "ok") return { error: res.message || "error" };
  return { id: res.id };
}

export async function submitFeedback(
  id: string,
  fb: { overall: number | null; content: number | null; benefit: string; recommend: boolean | null; comment: string }
) {
  if (!supabase) return { error: "not_configured" as const };
  const { error } = await supabase.rpc("training_submit_feedback", {
    p_id: id,
    p_overall: fb.overall,
    p_content: fb.content,
    p_benefit: fb.benefit,
    p_recommend: fb.recommend,
    p_comment: fb.comment
  });
  return { error: error?.message };
}

export async function markPrinted(id: string) {
  if (!supabase) return { error: "not_configured" as const };
  const { error } = await supabase.rpc("training_mark_printed", { p_id: id });
  return { error: error?.message };
}

/* ---- Admin -------------------------------------------------------------- */

export async function adminFetchAttendance(courseId?: string): Promise<AttendanceRecord[]> {
  if (!supabase) return [];
  let q = supabase.from("training_attendance").select("*").order("checked_in_at", { ascending: false });
  if (courseId) q = q.eq("course_id", courseId);
  const { data } = await q;
  return (data ?? []) as AttendanceRecord[];
}

export async function adminUpdateConfig(patch: Partial<Record<string, unknown>>) {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("training_config").update(patch).eq("id", true);
  return { error: error?.message };
}
