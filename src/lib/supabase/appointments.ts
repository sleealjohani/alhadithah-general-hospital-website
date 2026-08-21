import { supabase } from "./client";

/* Clinic appointment requests. Patient records hold PII, so every public
   operation goes through a SECURITY DEFINER RPC — the table itself is only
   readable by admins/reviewers via RLS. */

export type AppointmentStatus =
  | "pending"
  | "approved"
  | "rescheduled"
  | "completed"
  | "cancelled"
  | "no_show";

export type AppointmentClinic = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  instructions_ar: string | null;
  instructions_en: string | null;
  location_ar: string | null;
  location_en: string | null;
  work_days: number[];
  slot_start: string;
  slot_end: string;
  slot_minutes: number;
  slot_capacity: number;
  lead_days: number;
  horizon_days: number;
  is_active: boolean;
  sort_order: number;
};

/* What a visitor sees about their own request (no internal notes). */
export type AppointmentPublic = {
  reference: string;
  full_name: string;
  phone: string;
  national_id: string;
  nationality: string | null;
  clinic_name_ar: string | null;
  clinic_name_en: string | null;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  admin_note: string | null;
  notes: string | null;
  created_at: string;
  instructions_ar: string | null;
  instructions_en: string | null;
  location_ar: string | null;
  location_en: string | null;
};

/* The full record the registration desk works with. */
export type AppointmentAdmin = AppointmentPublic & {
  id: string;
  clinic_id: string | null;
  dob: string | null;
  dob_calendar: "gregorian" | "hijri";
  internal_note: string | null;
};

export type Slot = { time: string; free: number };

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "pending",
  "approved",
  "rescheduled",
  "completed",
  "cancelled",
  "no_show"
];

/* ---- Public reads ------------------------------------------------------- */

export async function fetchBookableClinics(): Promise<AppointmentClinic[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("appointment_clinics")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []) as AppointmentClinic[];
}

export async function fetchSlots(clinicId: string, date: string): Promise<Slot[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("appointment_slots", { p_clinic: clinicId, p_date: date });
  if (error || !data) return [];
  const res = data as { status: string; slots?: Slot[] };
  return res.status === "ok" ? res.slots ?? [] : [];
}

/* ---- Public writes ------------------------------------------------------ */

export type BookingInput = {
  clinicId: string;
  fullName: string;
  nationalId: string;
  nationality: string;
  phone: string;
  dob: string;
  dobCalendar: "gregorian" | "hijri";
  date: string;
  time: string;
  notes: string;
};

export async function requestAppointment(input: BookingInput) {
  if (!supabase) return { error: "not_configured" as const };
  const { data, error } = await supabase.rpc("request_appointment", {
    p_clinic: input.clinicId,
    p_name: input.fullName,
    p_national: input.nationalId,
    p_nationality: input.nationality,
    p_phone: input.phone,
    p_dob: input.dob,
    p_dob_calendar: input.dobCalendar,
    p_date: input.date,
    p_time: input.time,
    p_notes: input.notes
  });
  if (error) return { error: error.message };
  const res = data as { status: string; reference?: string; message?: string };
  if (res.status !== "ok") return { error: res.message || "error" };
  return { reference: res.reference as string };
}

export async function lookupAppointments(identifier: string) {
  if (!supabase) return { error: "not_configured" as const, items: [] };
  const { data, error } = await supabase.rpc("lookup_appointments", { p_identifier: identifier });
  if (error) return { error: error.message, items: [] };
  const res = data as { status: string; items?: AppointmentPublic[]; message?: string };
  if (res.status !== "ok") return { error: res.message || "error", items: [] };
  return { error: undefined, items: res.items ?? [] };
}

export async function rescheduleAppointment(reference: string, date: string, time: string) {
  if (!supabase) return { error: "not_configured" as const };
  const { data, error } = await supabase.rpc("update_appointment", {
    p_reference: reference,
    p_date: date,
    p_time: time,
    p_cancel: false
  });
  if (error) return { error: error.message };
  const res = data as { status: string; message?: string };
  return res.status === "ok" ? { error: undefined } : { error: res.message || "error" };
}

export async function cancelAppointment(reference: string) {
  if (!supabase) return { error: "not_configured" as const };
  const { data, error } = await supabase.rpc("update_appointment", {
    p_reference: reference,
    p_date: null,
    p_time: null,
    p_cancel: true
  });
  if (error) return { error: error.message };
  const res = data as { status: string; message?: string };
  return res.status === "ok" ? { error: undefined } : { error: res.message || "error" };
}

/* ---- Admin -------------------------------------------------------------- */

export async function adminFetchAppointments(filters: {
  clinicId?: string;
  status?: string;
  from?: string;
  to?: string;
}): Promise<AppointmentAdmin[]> {
  if (!supabase) return [];
  let q = supabase
    .from("appointments")
    .select("*")
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: true });
  if (filters.clinicId) q = q.eq("clinic_id", filters.clinicId);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.from) q = q.gte("appointment_date", filters.from);
  if (filters.to) q = q.lte("appointment_date", filters.to);
  const { data } = await q;
  return (data ?? []) as AppointmentAdmin[];
}

export async function adminUpdateAppointment(id: string, patch: Partial<AppointmentAdmin>) {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("appointments").update(patch).eq("id", id);
  return { error: error?.message };
}

export async function adminDeleteAppointment(id: string) {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  return { error: error?.message };
}

export async function adminFetchClinics(): Promise<AppointmentClinic[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("appointment_clinics").select("*").order("sort_order");
  return (data ?? []) as AppointmentClinic[];
}

export async function adminUpsertClinic(row: Partial<AppointmentClinic>) {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("appointment_clinics").upsert(row, { onConflict: "id" });
  return { error: error?.message };
}

export async function adminDeleteClinic(id: string) {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("appointment_clinics").delete().eq("id", id);
  return { error: error?.message };
}

/* ---- Helpers ------------------------------------------------------------ */

/* Dates the clinic actually opens, from lead_days up to horizon_days. */
export function bookableDates(clinic: AppointmentClinic, now = new Date()): string[] {
  const out: string[] = [];
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  for (let i = clinic.lead_days; i <= clinic.horizon_days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (clinic.work_days.includes(d.getDay())) {
      out.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      );
    }
  }
  return out;
}

/* "14:30:00" → "14:30" */
export const shortTime = (t: string) => (t || "").slice(0, 5);
