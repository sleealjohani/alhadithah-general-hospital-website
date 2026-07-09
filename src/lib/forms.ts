import { z } from "zod";
import { supabase } from "./supabase";
import type { FormKind } from "./data";

export type PortalFormPayload = {
  name?: string;
  email?: string;
  phone?: string;
  category?: string;
  subject?: string;
  message?: string;
  department?: string;
  priority?: string;
  title?: string;
  expectedImpact?: string;
  location?: string;
};

export type SubmissionResult = {
  ok: boolean;
  source: "supabase" | "local";
  message: string;
};

const payloadSchema = z.object({
  name: z.string().max(120).optional(),
  email: z.string().email().max(160).optional().or(z.literal("")),
  phone: z.string().max(40).optional(),
  category: z.string().max(120).optional(),
  subject: z.string().max(180).optional(),
  message: z.string().min(10).max(3000).optional(),
  department: z.string().max(120).optional(),
  priority: z.string().max(60).optional(),
  title: z.string().max(180).optional(),
  expectedImpact: z.string().max(1200).optional(),
  location: z.string().max(180).optional()
});

const tableByKind: Record<FormKind, string> = {
  contact: "contact_messages",
  experience: "experience_feedback",
  initiative: "initiative_submissions",
  good_catch: "good_catch_reports"
};

function persistLocal(kind: FormKind, payload: PortalFormPayload) {
  const key = `hadetha_${kind}_submissions`;
  const current = JSON.parse(localStorage.getItem(key) || "[]") as unknown[];
  current.unshift({
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    status: "local_preview",
    ...payload
  });
  localStorage.setItem(key, JSON.stringify(current.slice(0, 100)));
}

export function readLocalSubmissions(kind: FormKind): Array<Record<string, unknown>> {
  const key = `hadetha_${kind}_submissions`;
  return JSON.parse(localStorage.getItem(key) || "[]") as Array<Record<string, unknown>>;
}

export async function submitPortalForm(
  kind: FormKind,
  payload: PortalFormPayload
): Promise<SubmissionResult> {
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      source: "local",
      message: parsed.error.issues[0]?.message || "Invalid form data."
    };
  }

  const cleanPayload = parsed.data;
  const row = {
    name: cleanPayload.name || null,
    email: cleanPayload.email || null,
    phone: cleanPayload.phone || null,
    category: cleanPayload.category || null,
    subject: cleanPayload.subject || cleanPayload.title || null,
    message: cleanPayload.message || cleanPayload.expectedImpact || null,
    department: cleanPayload.department || null,
    priority: cleanPayload.priority || null,
    location: cleanPayload.location || null,
    status: "new",
    metadata: cleanPayload
  };

  if (supabase) {
    const { error } = await supabase.from(tableByKind[kind]).insert(row);
    if (!error) {
      return {
        ok: true,
        source: "supabase",
        message: "Submitted to Supabase."
      };
    }
  }

  persistLocal(kind, cleanPayload);
  return {
    ok: true,
    source: "local",
    message: "Saved locally for development preview."
  };
}
