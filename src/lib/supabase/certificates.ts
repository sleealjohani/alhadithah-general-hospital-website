import { supabase } from "./client";

export type CertificateResult = { recipient_id:string; full_name:string; employee_number:string|null; national_id:string|null; event_id:string; title_ar:string; title_en:string; lecture_date:string; template_url:string|null };
export type CertificateEvent = { id:string; title_ar:string; title_en:string; lecture_date:string; template_url:string|null; is_active:boolean };
export type CertificateRecipient = { id:string; event_id:string; full_name:string; national_id:string|null; employee_number:string|null };

export async function lookupCertificate(identifier:string) {
  if (!supabase) return { data:null, error:"not_configured" };
  const { data, error } = await supabase.rpc("lookup_lecture_certificate", { p_identifier:identifier.trim() });
  if (error) return { data:null, error:error.message };
  if (!data || data.status === "not_found") return { data:null, error:"not_found" };
  return { data:data as CertificateResult, error:null };
}
export async function fetchCertificateEvents(){ if(!supabase)return []; const {data}=await supabase.from("certificate_events").select("*").order("lecture_date",{ascending:false}); return (data??[]) as CertificateEvent[]; }
export async function fetchCertificateRecipients(eventId:string){ if(!supabase)return []; const {data}=await supabase.from("certificate_recipients").select("*").eq("event_id",eventId).order("full_name"); return (data??[]) as CertificateRecipient[]; }
export async function saveCertificateEvent(event:Partial<CertificateEvent>){ if(!supabase)return {error:"not_configured"}; const payload={title_ar:event.title_ar,title_en:event.title_en,lecture_date:event.lecture_date,template_url:event.template_url,is_active:event.is_active}; const q=event.id?supabase.from("certificate_events").update(payload).eq("id",event.id):supabase.from("certificate_events").insert(payload); const {error}=await q; return {error:error?.message}; }
export async function saveCertificateRecipient(recipient:Partial<CertificateRecipient>){ if(!supabase)return {error:"not_configured"}; const payload={event_id:recipient.event_id,full_name:recipient.full_name,national_id:recipient.national_id||null,employee_number:recipient.employee_number||null}; const q=recipient.id?supabase.from("certificate_recipients").update(payload).eq("id",recipient.id):supabase.from("certificate_recipients").insert(payload); const {error}=await q; return {error:error?.message}; }
export async function deleteCertificateRecipient(id:string){ if(!supabase)return {error:"not_configured"}; const {error}=await supabase.from("certificate_recipients").delete().eq("id",id); return {error:error?.message}; }
