import { supabase } from "./client";
import type { CertField, CertFieldKey, TrainingConfig } from "./attendance";

/* Self-service lecture certificates. Recipients (with national IDs) are never
   publicly readable — the public page reaches only its own match through the
   lookup RPC. The certificate is rendered/downloaded with the shared
   canvas→PDF pipeline (src/features/training/certificatePdf.ts). */

export type CertFieldsMap = Partial<Record<CertFieldKey, CertField>>;

export type CertificateEvent = {
  id: string;
  title_ar: string;
  title_en: string;
  cert_title_ar: string | null;
  cert_title_en: string | null;
  duration_ar: string | null;
  duration_en: string | null;
  lecture_date: string;
  template_url: string | null;
  cert_fields: CertFieldsMap;
  is_active: boolean;
};

export type CertificateResult = {
  recipient_id: string;
  full_name: string;
  employee_number: string | null;
  national_id: string | null;
  event_id: string;
  title_ar: string;
  title_en: string;
  cert_title_ar: string | null;
  cert_title_en: string | null;
  duration_ar: string | null;
  duration_en: string | null;
  lecture_date: string;
  template_url: string | null;
  cert_fields: CertFieldsMap;
};

export type CertificateRecipient = {
  id: string;
  event_id: string;
  full_name: string;
  national_id: string | null;
  employee_number: string | null;
};

/* Adapt an event (or lookup result) to the shared certificate renderer config. */
export function eventToCertConfig(source: {
  template_url: string | null;
  cert_fields: CertFieldsMap;
}): TrainingConfig {
  return {
    open_before_min: 0,
    hide_after_hours: 0,
    cert_bg_url: source.template_url,
    cert_word_url: null,
    cert_fields: source.cert_fields ?? {},
    questionnaire: {}
  };
}

export async function lookupCertificate(identifier: string) {
  if (!supabase) return { data: null, error: "not_configured" };
  const { data, error } = await supabase.rpc("lookup_lecture_certificate", { p_identifier: identifier.trim() });
  if (error) return { data: null, error: error.message };
  if (!data || data.status === "not_found") return { data: null, error: "not_found" };
  return { data: data as CertificateResult, error: null };
}

export async function fetchCertificateEvents(): Promise<CertificateEvent[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("certificate_events").select("*").order("lecture_date", { ascending: false });
  return (data ?? []).map((e) => ({ ...e, cert_fields: (e.cert_fields ?? {}) as CertFieldsMap })) as CertificateEvent[];
}

export async function fetchCertificateRecipients(eventId: string): Promise<CertificateRecipient[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("certificate_recipients")
    .select("*")
    .eq("event_id", eventId)
    .order("full_name");
  return (data ?? []) as CertificateRecipient[];
}

export async function saveCertificateEvent(event: Partial<CertificateEvent>) {
  if (!supabase) return { error: "not_configured" };
  const payload = {
    title_ar: event.title_ar,
    title_en: event.title_en,
    cert_title_ar: event.cert_title_ar,
    cert_title_en: event.cert_title_en,
    duration_ar: event.duration_ar,
    duration_en: event.duration_en,
    lecture_date: event.lecture_date,
    template_url: event.template_url,
    cert_fields: event.cert_fields ?? {},
    is_active: event.is_active
  };
  const q = event.id
    ? supabase.from("certificate_events").update(payload).eq("id", event.id)
    : supabase.from("certificate_events").insert(payload);
  const { error } = await q;
  return { error: error?.message };
}

export async function saveCertificateRecipient(recipient: Partial<CertificateRecipient>) {
  if (!supabase) return { error: "not_configured" };
  const payload = {
    event_id: recipient.event_id,
    full_name: recipient.full_name,
    national_id: recipient.national_id || null,
    employee_number: recipient.employee_number || null
  };
  const q = recipient.id
    ? supabase.from("certificate_recipients").update(payload).eq("id", recipient.id)
    : supabase.from("certificate_recipients").insert(payload);
  const { error } = await q;
  return { error: error?.message };
}

export async function deleteCertificateRecipient(id: string) {
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.from("certificate_recipients").delete().eq("id", id);
  return { error: error?.message };
}

/* Bulk add pasted recipients (name / national id / employee number rows). */
export async function bulkAddRecipients(eventId: string, rows: Array<Omit<CertificateRecipient, "id" | "event_id">>) {
  if (!supabase) return { error: "not_configured", count: 0 };
  if (rows.length === 0) return { error: undefined, count: 0 };
  const payload = rows.map((r) => ({
    event_id: eventId,
    full_name: r.full_name,
    national_id: r.national_id || null,
    employee_number: r.employee_number || null
  }));
  const { data, error } = await supabase.from("certificate_recipients").insert(payload).select("id");
  return { error: error?.message, count: data?.length ?? 0 };
}
