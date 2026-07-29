import { useEffect, useMemo, useState } from "react";
import { Award, Plus, Save, Trash2, UploadCloud } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { tx } from "../../utils/i18n";
import {
  bulkAddRecipients,
  deleteCertificateRecipient,
  eventToCertConfig,
  fetchCertificateEvents,
  fetchCertificateRecipients,
  saveCertificateEvent,
  saveCertificateRecipient,
  type CertificateEvent,
  type CertificateRecipient,
  type CertFieldsMap
} from "../../lib/supabase/certificates";
import {
  certField,
  DEFAULT_CERT_FIELDS,
  type CertField,
  type CertFieldKey
} from "../../lib/supabase/attendance";
import { ImageField } from "./ImageField";
import { CertificateView } from "../training/CertificateView";

type Notify = (m: string, tone?: "success" | "error" | "info") => void;
const FIELD_KEYS: CertFieldKey[] = ["name", "employee_number", "course", "duration", "date"];
const FIELD_LABELS: Record<CertFieldKey, ReturnType<typeof tx>> = {
  name: tx("الاسم", "Name"),
  employee_number: tx("الرقم الوظيفي", "Employee number"),
  course: tx("اسم المحاضرة", "Lecture name"),
  duration: tx("المدة", "Duration"),
  date: tx("التاريخ", "Date")
};

export function AdminCertificates({ notify }: { notify: Notify }) {
  const { t, locale } = usePortal();
  const [events, setEvents] = useState<CertificateEvent[]>([]);
  const [eventId, setEventId] = useState("");
  const current = events.find((e) => e.id === eventId) || null;

  const loadEvents = () =>
    fetchCertificateEvents().then((es) => {
      setEvents(es);
      setEventId((v) => v || es[0]?.id || "");
    });
  useEffect(() => {
    void loadEvents();
  }, []);

  const patchCurrent = (p: Partial<CertificateEvent>) =>
    setEvents((es) => es.map((x) => (x.id === eventId ? { ...x, ...p } : x)));

  const addEvent = async () => {
    const { error } = await saveCertificateEvent({
      title_ar: "محاضرة جديدة",
      title_en: "New lecture",
      cert_title_ar: "شهادة حضور",
      cert_title_en: "Certificate of Attendance",
      duration_ar: "ساعة واحدة",
      duration_en: "One hour",
      lecture_date: new Date().toISOString().slice(0, 10),
      template_url: null,
      cert_fields: {},
      is_active: true
    });
    if (error) return notify(error, "error");
    notify(t(tx("تمت الإضافة.", "Added.")), "success");
    loadEvents();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <h1>{t(tx("شهادات المحاضرات", "Lecture certificates"))}</h1>
          <p>{t(tx("أدر بيانات الشهادة، القالب، مواضع الحقول، وأسماء المستحقين.", "Manage certificate details, template, field positions, and eligible employees."))}</p>
        </div>
        <a className="btn btn-secondary" href="/certificates" target="_blank" rel="noreferrer">
          {t(tx("فتح صفحة الشهادات", "Open certificate page"))}
        </a>
      </div>

      <div className="admin-panel admin-form" style={{ marginBottom: 20 }}>
        <div className="field-wide" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <label style={{ flex: 1, minWidth: 220 }}>
            {t(tx("المحاضرة", "Lecture"))}
            <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {t(tx(e.title_ar, e.title_en || e.title_ar))} {e.is_active ? "" : "•"}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-secondary" onClick={addEvent}>
            <Plus size={16} />
            {t(tx("محاضرة جديدة", "New lecture"))}
          </button>
        </div>
      </div>

      {current ? (
        <>
          <EventSettings key={current.id} event={current} onPatch={patchCurrent} onSaved={loadEvents} notify={notify} />
          <RecipientsManager eventId={current.id} notify={notify} />
          <PreviewCard event={current} locale={locale} />
        </>
      ) : (
        <div className="admin-panel muted">{t(tx("أضف محاضرة للبدء.", "Add a lecture to begin."))}</div>
      )}
    </div>
  );
}

/* ---- Event settings + certificate designer ------------------------------ */
function EventSettings({
  event,
  onPatch,
  onSaved,
  notify
}: {
  event: CertificateEvent;
  onPatch: (p: Partial<CertificateEvent>) => void;
  onSaved: () => void;
  notify: Notify;
}) {
  const { t } = usePortal();
  const [fields, setFields] = useState<Record<CertFieldKey, CertField>>(() => {
    const merged = { ...DEFAULT_CERT_FIELDS };
    FIELD_KEYS.forEach((k) => (merged[k] = certField(eventToCertConfig(event), k)));
    return merged;
  });
  const [busy, setBusy] = useState(false);
  const setField = (k: CertFieldKey, p: Partial<CertField>) => setFields((f) => ({ ...f, [k]: { ...f[k], ...p } }));

  const sample: Record<CertFieldKey, string> = {
    name: event.title_ar ? "مشاعل عايد العنزي" : "Attendee Name",
    employee_number: "50570476",
    course: t(tx(event.title_ar, event.title_en || event.title_ar)),
    duration: t(tx(event.duration_ar || "ساعة", event.duration_en || "1 hour")),
    date: "28 يوليو 2026"
  };

  const save = async () => {
    setBusy(true);
    const { error } = await saveCertificateEvent({ ...event, cert_fields: fields as CertFieldsMap });
    setBusy(false);
    if (error) return notify(error, "error");
    notify(t(tx("تم الحفظ.", "Saved.")), "success");
    onSaved();
  };

  return (
    <>
      <div className="admin-panel admin-form" style={{ marginBottom: 20 }}>
        <h2 className="field-wide">{t(tx("بيانات الشهادة", "Certificate details"))}</h2>
        <label>{t(tx("اسم الشهادة (عربي)", "Certificate name (AR)"))}
          <input value={event.cert_title_ar ?? ""} onChange={(e) => onPatch({ cert_title_ar: e.target.value })} dir="auto" />
        </label>
        <label>{t(tx("اسم الشهادة (إنجليزي)", "Certificate name (EN)"))}
          <input value={event.cert_title_en ?? ""} onChange={(e) => onPatch({ cert_title_en: e.target.value })} dir="auto" />
        </label>
        <label>{t(tx("اسم المحاضرة (عربي)", "Lecture name (AR)"))}
          <input value={event.title_ar} onChange={(e) => onPatch({ title_ar: e.target.value })} dir="auto" />
        </label>
        <label>{t(tx("اسم المحاضرة (إنجليزي)", "Lecture name (EN)"))}
          <input value={event.title_en} onChange={(e) => onPatch({ title_en: e.target.value })} dir="auto" />
        </label>
        <label>{t(tx("المدة (عربي)", "Duration (AR)"))}
          <input value={event.duration_ar ?? ""} onChange={(e) => onPatch({ duration_ar: e.target.value })} dir="auto" />
        </label>
        <label>{t(tx("المدة (إنجليزي)", "Duration (EN)"))}
          <input value={event.duration_en ?? ""} onChange={(e) => onPatch({ duration_en: e.target.value })} dir="auto" />
        </label>
        <label>{t(tx("التاريخ", "Date"))}
          <input type="date" value={event.lecture_date} onChange={(e) => onPatch({ lecture_date: e.target.value })} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
          <input type="checkbox" checked={event.is_active} onChange={(e) => onPatch({ is_active: e.target.checked })} style={{ width: 18, height: 18 }} />
          {t(tx("نشطة (تظهر للموظفين)", "Active (visible to employees)"))}
        </label>
        <div className="field-wide">
          <ImageField label={tx("قالب الشهادة (صورة)", "Certificate template (image)")} value={event.template_url ?? ""} onChange={(url) => onPatch({ template_url: url })} aspect={297 / 210} />
        </div>
      </div>

      <div className="admin-panel" style={{ marginBottom: 20 }}>
        <h2>{t(tx("مواضع الحقول على القالب", "Field positions on the template"))}</h2>
        <p className="muted" style={{ margin: "-4px 0 10px" }}>
          {t(tx("رتّب كل حقل فوق القالب بدقة (لن تنزاح الشهادة بعد الآن).", "Position each field precisely over the template — the layout stays fixed."))}
        </p>
        <div className="cert-preview-wrap">
          <div className={`cert-sheet ${event.template_url ? "" : "cert-sheet-fallback"}`}>
            {event.template_url ? <img className="cert-bg" src={event.template_url} alt="" /> : (
              <div className="cert-fallback-frame">
                <span className="cert-fallback-eyebrow">{t(tx(event.cert_title_ar || "شهادة حضور", event.cert_title_en || "Certificate"))}</span>
                <span className="cert-fallback-sub">{t(tx("مستشفى الحديثة العام", "Hadetha General Hospital"))}</span>
              </div>
            )}
            {FIELD_KEYS.map((k) => {
              const f = fields[k];
              if (!f.enabled) return null;
              return (
                <span key={k} className="cert-field" style={{ left: `${f.x}%`, top: `${f.y}%`, transform: "translate(-50%,-50%)", fontSize: `${(f.size / 1000) * 100}cqw`, color: f.color, fontWeight: f.weight, textAlign: f.align, width: "90%" }}>
                  {sample[k]}
                </span>
              );
            })}
          </div>
        </div>
        <div className="admin-table-wrap" style={{ marginTop: 14 }}>
          <table className="admin-table cert-fields-table">
            <thead><tr>
              <th>{t(tx("الحقل", "Field"))}</th><th>X%</th><th>Y%</th><th>{t(tx("الحجم", "Size"))}</th>
              <th>{t(tx("اللون", "Color"))}</th><th>{t(tx("الثقل", "Weight"))}</th><th>{t(tx("المحاذاة", "Align"))}</th><th>{t(tx("ظاهر", "On"))}</th>
            </tr></thead>
            <tbody>
              {FIELD_KEYS.map((k) => {
                const f = fields[k];
                return (
                  <tr key={k}>
                    <td>{t(FIELD_LABELS[k])}</td>
                    <td><input type="number" value={f.x} onChange={(e) => setField(k, { x: Number(e.target.value) })} className="cert-num" /></td>
                    <td><input type="number" value={f.y} onChange={(e) => setField(k, { y: Number(e.target.value) })} className="cert-num" /></td>
                    <td><input type="number" value={f.size} onChange={(e) => setField(k, { size: Number(e.target.value) })} className="cert-num" /></td>
                    <td><input type="color" value={f.color} onChange={(e) => setField(k, { color: e.target.value })} /></td>
                    <td>
                      <select value={f.weight} onChange={(e) => setField(k, { weight: Number(e.target.value) })}>
                        <option value={400}>400</option><option value={600}>600</option><option value={700}>700</option><option value={800}>800</option>
                      </select>
                    </td>
                    <td>
                      <select value={f.align} onChange={(e) => setField(k, { align: e.target.value as CertField["align"] })}>
                        <option value="start">{t(tx("بداية", "Start"))}</option><option value="center">{t(tx("وسط", "Center"))}</option><option value="end">{t(tx("نهاية", "End"))}</option>
                      </select>
                    </td>
                    <td><input type="checkbox" checked={f.enabled} onChange={(e) => setField(k, { enabled: e.target.checked })} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <button className="btn btn-primary" disabled={busy} onClick={save} style={{ marginBottom: 20 }}>
        <Save size={16} />
        {t(tx("حفظ بيانات الشهادة والمواضع", "Save certificate & positions"))}
      </button>
    </>
  );
}

/* ---- Recipients --------------------------------------------------------- */
function RecipientsManager({ eventId, notify }: { eventId: string; notify: Notify }) {
  const { t } = usePortal();
  const [rows, setRows] = useState<CertificateRecipient[]>([]);
  const [draft, setDraft] = useState({ full_name: "", national_id: "", employee_number: "" });
  const [paste, setPaste] = useState("");
  const [showImport, setShowImport] = useState(false);

  const load = () => fetchCertificateRecipients(eventId).then(setRows);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const add = async () => {
    if (!draft.full_name.trim()) return notify(t(tx("الاسم مطلوب.", "Name required.")), "error");
    const { error } = await saveCertificateRecipient({ ...draft, event_id: eventId });
    if (error) return notify(error, "error");
    setDraft({ full_name: "", national_id: "", employee_number: "" });
    load();
  };
  const saveRow = async (r: CertificateRecipient) => {
    const { error } = await saveCertificateRecipient(r);
    if (error) return notify(error, "error");
    notify(t(tx("تم الحفظ.", "Saved.")), "success");
  };
  const del = async (id: string) => {
    await deleteCertificateRecipient(id);
    setRows((xs) => xs.filter((x) => x.id !== id));
  };

  const runImport = async () => {
    const parsed = paste
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const cells = (l.includes("\t") ? l.split("\t") : l.split(",")).map((c) => c.trim());
        return { full_name: cells[0] || "", national_id: cells[1] || "", employee_number: cells[2] || "" };
      })
      .filter((r) => r.full_name);
    if (parsed.length === 0) return notify(t(tx("لا توجد صفوف صالحة.", "No valid rows.")), "error");
    const { error, count } = await bulkAddRecipients(eventId, parsed);
    if (error) return notify(error, "error");
    notify(t(tx(`تمت إضافة ${count}.`, `Added ${count}.`)), "success");
    setPaste("");
    setShowImport(false);
    load();
  };

  return (
    <>
      <div className="admin-panel admin-form" style={{ marginBottom: 20 }}>
        <div className="field-wide" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>{t(tx("المستحقون", "Recipients"))} ({rows.length})</h2>
          <button className="btn btn-ghost" onClick={() => setShowImport((v) => !v)}>
            <UploadCloud size={16} />
            {t(tx("استيراد لصق", "Paste import"))}
          </button>
        </div>
        {showImport ? (
          <div className="field-wide">
            <textarea
              className="staff-import-box"
              rows={6}
              dir="auto"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder={t(tx("الاسم\tرقم الهوية\tالرقم الوظيفي", "Name\tNational ID\tEmployee number"))}
            />
            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={runImport}>
              {t(tx("استيراد", "Import"))}
            </button>
          </div>
        ) : null}
        <div className="certificate-recipient-grid field-wide">
          <input placeholder={t(tx("الاسم الكامل", "Full name"))} value={draft.full_name} onChange={(e) => setDraft({ ...draft, full_name: e.target.value })} dir="auto" />
          <input placeholder={t(tx("رقم الهوية", "National ID"))} value={draft.national_id} onChange={(e) => setDraft({ ...draft, national_id: e.target.value })} dir="auto" />
          <input placeholder={t(tx("الرقم الوظيفي", "Employee number"))} value={draft.employee_number} onChange={(e) => setDraft({ ...draft, employee_number: e.target.value })} dir="auto" />
          <button className="btn btn-primary" onClick={add}>
            <Plus size={16} />
            {t(tx("إضافة", "Add"))}
          </button>
        </div>
      </div>

      <div className="admin-panel admin-table-wrap">
        <table className="admin-table">
          <thead><tr>
            <th>{t(tx("الاسم", "Name"))}</th><th>{t(tx("الهوية", "National ID"))}</th><th>{t(tx("الرقم الوظيفي", "Employee no."))}</th><th>{t(tx("إجراءات", "Actions"))}</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="muted">{t(tx("لا يوجد مستحقون.", "No recipients."))}</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}>
                <td><input value={r.full_name} onChange={(e) => setRows((xs) => xs.map((x) => (x.id === r.id ? { ...x, full_name: e.target.value } : x)))} dir="auto" /></td>
                <td><input value={r.national_id ?? ""} onChange={(e) => setRows((xs) => xs.map((x) => (x.id === r.id ? { ...x, national_id: e.target.value } : x)))} dir="auto" /></td>
                <td><input value={r.employee_number ?? ""} onChange={(e) => setRows((xs) => xs.map((x) => (x.id === r.id ? { ...x, employee_number: e.target.value } : x)))} dir="auto" /></td>
                <td>
                  <button className="icon-button" onClick={() => saveRow(r)} aria-label={t(tx("حفظ", "Save"))}><Save size={16} /></button>
                  <button className="icon-button" onClick={() => del(r.id)} aria-label={t(tx("حذف", "Delete"))}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---- Admin preview / manual issue --------------------------------------- */
function PreviewCard({ event, locale }: { event: CertificateEvent; locale: string }) {
  const { t } = usePortal();
  const [open, setOpen] = useState(false);
  const config = useMemo(() => eventToCertConfig(event), [event]);
  const values: Record<CertFieldKey, string> = {
    name: t(tx("اسم الموظف", "Attendee Name")),
    employee_number: "50570476",
    course: t(tx(event.title_ar, event.title_en || event.title_ar)),
    duration: t(tx(event.duration_ar || "", event.duration_en || "")),
    date: new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", { dateStyle: "long" }).format(new Date(event.lecture_date))
  };
  return (
    <div className="admin-panel" style={{ marginTop: 20 }}>
      <button className="btn btn-secondary" onClick={() => setOpen(true)}>
        <Award size={16} />
        {t(tx("معاينة الشهادة وتنزيلها", "Preview & download certificate"))}
      </button>
      {open ? <CertificateView config={config} values={values} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
