import { useEffect, useState } from "react";
import { Award, Eye, EyeOff, KeyRound, Pencil, ShieldCheck, Sparkles, Trash2, Upload } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { Modal } from "../../components/ui/Modal";
import { logAdminAction } from "../../lib/audit";
import { tx } from "../../utils/i18n";
import {
  adminBulkUpsertStaff,
  adminDeleteMedia,
  adminDeletePolicy,
  adminDeleteSpotlight,
  adminFetchMedia,
  adminFetchPolicies,
  adminFetchProfileItems,
  adminFetchSpotlight,
  adminFetchStaff,
  adminFetchVacations,
  adminResetPin,
  adminSetManager,
  adminSetMediaStatus,
  adminSetProfileStatus,
  adminSetVacationStatus,
  adminUpsertMedia,
  adminUpsertPolicy,
  adminUpsertSpotlight,
  adminUpsertStaff,
  type NursingMedia,
  type NursingPolicy,
  type NursingSpotlight,
  type NursingStaffAdmin,
  type ProfileItem,
  type VacationPlan
} from "../../lib/supabase/nursing";
import { parseStaffPaste, type ParseResult } from "../nursing/staffImport";
import { CrudFormActions, Field, TableLoadingRows, useDeleteConfirm } from "./shared";
import { ImageField } from "./ImageField";

type Tab = "staff" | "media" | "spotlight" | "policies" | "vacations" | "profiles";
type Notify = (m: string, tone?: "success" | "error" | "info") => void;

export function AdminNursing() {
  const { t, notify } = usePortal();
  const [tab, setTab] = useState<Tab>("staff");
  const tabs: [Tab, ReturnType<typeof tx>][] = [
    ["staff", tx("الكادر", "Staff")],
    ["media", tx("الوسائط", "Media")],
    ["spotlight", tx("ممرض الشهر", "Nurse of the Month")],
    ["policies", tx("السياسات", "Policies")],
    ["vacations", tx("الإجازات", "Vacations")],
    ["profiles", tx("اعتماد الوثائق", "Profile approvals")]
  ];
  return (
    <div className="admin-page">
      <SectionHeading
        title={tx("التمريض", "Nursing")}
        description={tx(
          "أدر كادر التمريض، الوسائط، السياسات، واعتمد طلبات الإجازات والوثائق المهنية.",
          "Manage nursing staff, media, policies, and approve vacation and credential requests."
        )}
      />
      <div className="tab-row" role="tablist">
        {tabs.map(([key, label]) => (
          <button key={key} type="button" className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
            {t(label)}
          </button>
        ))}
      </div>
      {tab === "staff" ? <StaffManager notify={notify} /> : null}
      {tab === "media" ? <MediaManager notify={notify} /> : null}
      {tab === "spotlight" ? <SpotlightManager notify={notify} /> : null}
      {tab === "policies" ? <PoliciesManager notify={notify} /> : null}
      {tab === "vacations" ? <VacationsInbox notify={notify} /> : null}
      {tab === "profiles" ? <ProfilesInbox notify={notify} /> : null}
    </div>
  );
}

/* ---- Staff -------------------------------------------------------------- */
function StaffManager({ notify }: { notify: Notify }) {
  const { t } = usePortal();
  const [rows, setRows] = useState<NursingStaffAdmin[] | null>(null);
  const [form, setForm] = useState<Partial<NursingStaffAdmin>>({});
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const editing = Boolean(form.id);
  const load = () => adminFetchStaff().then(setRows);
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee_number?.trim() || !form.full_name?.trim())
      return notify(t(tx("الرقم الوظيفي والاسم مطلوبان.", "Employee number and name are required.")), "error");
    setBusy(true);
    const { error } = await adminUpsertStaff(form);
    setBusy(false);
    if (error) return notify(error, "error");
    logAdminAction(editing ? "nursing.staff.update" : "nursing.staff.create", "nursing_staff", form.id ?? null);
    notify(t(tx("تم الحفظ.", "Saved.")), "success");
    setForm({});
    load();
  };

  const toggleManager = async (row: NursingStaffAdmin) => {
    const { error } = await adminSetManager(row.id, !row.is_manager);
    if (error) return notify(error, "error");
    load();
  };
  const resetPin = async (row: NursingStaffAdmin) => {
    const { error } = await adminResetPin(row.id);
    if (error) return notify(error, "error");
    notify(t(tx("تم تصفير الرقم السري، سيُنشئه الموظف عند الدخول.", "PIN reset — the staff member sets a new one on next sign-in.")), "success");
  };

  const filtered = (rows ?? []).filter((r) =>
    !q.trim() || r.full_name.includes(q) || (r.employee_number || "").includes(q) || (r.department || "").includes(q));

  return (
    <>
      <div className="admin-panel admin-form" style={{ marginBottom: 20 }}>
        <h2 className="field-wide">{editing ? t(tx("تعديل موظف", "Edit staff")) : t(tx("إضافة موظف", "Add staff"))}</h2>
        <form onSubmit={save} style={{ display: "contents" }}>
          <Field label={tx("الرقم الوظيفي", "Employee number")}><input value={form.employee_number ?? ""} onChange={(e) => setForm({ ...form, employee_number: e.target.value })} dir="auto" /></Field>
          <Field label={tx("الاسم", "Full name")}><input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} dir="auto" /></Field>
          <Field label={tx("التخصص", "Specialty")}><input value={form.specialty ?? ""} onChange={(e) => setForm({ ...form, specialty: e.target.value })} dir="auto" /></Field>
          <Field label={tx("القسم", "Department")}><input value={form.department ?? ""} onChange={(e) => setForm({ ...form, department: e.target.value })} dir="auto" /></Field>
          <Field label={tx("الجوال", "Phone")}><input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="auto" /></Field>
          <Field label={tx("البريد", "Email")}><input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="auto" /></Field>
          <div className="field-wide" style={{ display: "flex", gap: 10 }}>
            <CrudFormActions busy={busy} editing={editing} onCancel={() => setForm({})} />
          </div>
        </form>
      </div>

      <div className="inbox-toolbar">
        <label className="inbox-filter">{t(tx("بحث", "Search"))}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(tx("اسم / رقم وظيفي / قسم", "name / number / dept"))} dir="auto" />
        </label>
        <div className="inbox-toolbar-end">
          <span className="muted">{filtered.length} {t(tx("موظف", "staff"))}</span>
          <button type="button" className="btn btn-secondary" onClick={() => setImportOpen(true)}>
            <Upload size={16} />
            {t(tx("استيراد من Excel", "Import from Excel"))}
          </button>
        </div>
      </div>

      <div className="admin-panel admin-table-wrap">
        <table className="admin-table">
          <thead><tr>
            <th>{t(tx("الاسم", "Name"))}</th><th>{t(tx("الرقم", "No."))}</th><th>{t(tx("التخصص", "Specialty"))}</th>
            <th>{t(tx("القسم", "Dept"))}</th><th>{t(tx("مدير", "Manager"))}</th><th>{t(tx("PIN", "PIN"))}</th><th>{t(tx("إجراءات", "Actions"))}</th>
          </tr></thead>
          <tbody>
            {rows === null ? <TableLoadingRows cols={7} /> : filtered.length === 0 ? (
              <tr><td colSpan={7} className="muted">{t(tx("لا يوجد كادر. استورد قاعدة البيانات في Supabase.", "No staff. Import the database in Supabase."))}</td></tr>
            ) : filtered.map((row) => (
              <tr key={row.id}>
                <td>{row.full_name}</td>
                <td className="mono">{row.employee_number}</td>
                <td>{row.specialty || "—"}</td>
                <td>{row.department || "—"}</td>
                <td>
                  <button className={`booked-pill ${row.is_manager ? "" : "muted"}`} onClick={() => toggleManager(row)} title={t(tx("تبديل صفة المدير", "Toggle manager"))}>
                    <ShieldCheck size={14} /> {row.is_manager ? t(tx("مدير", "Manager")) : t(tx("تعيين", "Set"))}
                  </button>
                </td>
                <td>{row.has_pin ? <span className="badge badge-success">{t(tx("مُفعّل", "Set"))}</span> : <span className="badge badge-muted">{t(tx("لا", "None"))}</span>}</td>
                <td>
                  <button className="icon-button" onClick={() => setForm(row)} aria-label={t(tx("تعديل", "Edit"))}><Pencil size={16} /></button>
                  <button className="icon-button" onClick={() => resetPin(row)} aria-label={t(tx("تصفير PIN", "Reset PIN"))}><KeyRound size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {importOpen ? (
        <StaffImportModal
          notify={notify}
          onClose={() => setImportOpen(false)}
          onImported={() => { setImportOpen(false); load(); }}
        />
      ) : null}
    </>
  );
}

/* ---- Staff bulk import (paste from Excel) ------------------------------- */
function StaffImportModal({ notify, onClose, onImported }: { notify: Notify; onClose: () => void; onImported: () => void }) {
  const { t } = usePortal();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);

  const preview = () => setResult(parseStaffPaste(text));

  const runImport = async () => {
    const parsed = result ?? parseStaffPaste(text);
    setResult(parsed);
    if (parsed.error === "missing_required")
      return notify(t(tx("لم يتم العثور على عمودَي الرقم الوظيفي والاسم في الصف الأول.", "Couldn't find the employee-number and name columns in the header row.")), "error");
    if (parsed.error === "need_header_and_rows")
      return notify(t(tx("الصق صف العناوين ثم صفوف البيانات.", "Paste a header row followed by data rows.")), "error");
    if (parsed.rows.length === 0)
      return notify(t(tx("لا توجد صفوف صالحة.", "No valid rows found.")), "error");
    setBusy(true);
    const { error, count } = await adminBulkUpsertStaff(parsed.rows);
    setBusy(false);
    if (error) return notify(error, "error");
    logAdminAction("nursing.staff.import", "nursing_staff", null);
    notify(t(tx(`تم استيراد ${count} موظف.`, `Imported ${count} staff.`)), "success");
    onImported();
  };

  return (
    <Modal title={t(tx("استيراد كادر التمريض", "Import nursing staff"))} onClose={onClose} wide>
      <div className="staff-import">
        <ol className="staff-import-steps">
          <li>{t(tx("افتح ملف Excel وحدّد صف العناوين مع كل الصفوف.", "Open your Excel sheet and select the header row plus all data rows."))}</li>
          <li>{t(tx("انسخ (Ctrl+C) ثم الصق في الصندوق أدناه.", "Copy (Ctrl+C) and paste into the box below."))}</li>
          <li>{t(tx("عمودا «الرقم الوظيفي» و«الاسم» مطلوبان؛ بقية الأعمدة تُطابَق تلقائيًا.", "Employee-number and name columns are required; the rest are matched automatically."))}</li>
        </ol>
        <textarea
          className="staff-import-box"
          value={text}
          onChange={(e) => { setText(e.target.value); setResult(null); }}
          onBlur={preview}
          rows={10}
          dir="auto"
          placeholder={t(tx("الرقم الوظيفي\tالاسم\tالتخصص\tالقسم …", "Employee No\tName\tSpecialty\tDepartment …"))}
        />
        {result ? (
          <div className="staff-import-summary">
            {result.error ? (
              <p className="portal-alert" style={{ margin: 0 }}>
                {result.error === "missing_required"
                  ? t(tx("لم يُعثر على عمودَي الرقم الوظيفي والاسم.", "Employee-number and name columns not found."))
                  : t(tx("الصق صف العناوين ثم صفوف البيانات.", "Paste a header row followed by data rows."))}
              </p>
            ) : (
              <>
                <p><strong>{result.rows.length}</strong> {t(tx("صف جاهز للاستيراد", "rows ready to import"))}
                  {result.skipped > 0 ? ` · ${result.skipped} ${t(tx("تم تجاهله", "skipped"))}` : ""}</p>
                <p className="muted">{t(tx("الأعمدة المتطابقة:", "Matched columns:"))} {result.mapped.join(", ")}</p>
                {result.unmatchedHeaders.length > 0 ? (
                  <p className="muted">{t(tx("أعمدة غير متطابقة (ستُتجاهل):", "Unmatched (ignored):"))} {result.unmatchedHeaders.join(", ")}</p>
                ) : null}
              </>
            )}
          </div>
        ) : null}
        <div className="staff-import-actions">
          <button type="button" className="btn btn-ghost" onClick={preview}>{t(tx("معاينة", "Preview"))}</button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={runImport}>
            <Upload size={16} />
            {busy ? t(tx("جارٍ الاستيراد…", "Importing…")) : t(tx("استيراد", "Import"))}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---- Media -------------------------------------------------------------- */
const emptyMedia = (): Partial<NursingMedia> => ({ media_type: "image", status: "published", sort_order: 100 });

function MediaManager({ notify }: { notify: Notify }) {
  const { t } = usePortal();
  const [rows, setRows] = useState<NursingMedia[] | null>(null);
  const [form, setForm] = useState<Partial<NursingMedia>>(emptyMedia);
  const [busy, setBusy] = useState(false);
  const editing = Boolean(form.id);
  const load = () => adminFetchMedia().then(setRows);
  useEffect(() => { load(); }, []);
  const { dialog, requestDelete } = useDeleteConfirm(async (id) => {
    const { error } = await adminDeleteMedia(id);
    if (error) return notify(error, "error");
    notify(t(tx("تم الحذف.", "Deleted.")), "success"); load();
  });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.media_url?.trim()) return notify(t(tx("الرابط مطلوب.", "URL required.")), "error");
    setBusy(true);
    const { error } = await adminUpsertMedia(form);
    setBusy(false);
    if (error) return notify(error, "error");
    logAdminAction(editing ? "nursing.media.update" : "nursing.media.create", "nursing_media", form.id ?? null);
    notify(t(tx("تم الحفظ.", "Saved.")), "success");
    setForm(emptyMedia()); load();
  };
  const toggleActive = async (row: NursingMedia) => {
    const next = row.status === "published" ? "draft" : "published";
    const { error } = await adminSetMediaStatus(row.id, next);
    if (error) return notify(error, "error");
    notify(next === "published" ? t(tx("تم التفعيل.", "Activated.")) : t(tx("تم الإيقاف.", "Deactivated.")), "success");
    load();
  };
  return (
    <>
      <div className="admin-panel admin-form" style={{ marginBottom: 20 }}>
        <h2 className="field-wide">{editing ? t(tx("تعديل وسائط", "Edit media")) : t(tx("إضافة وسائط", "Add media"))}</h2>
        <p className="field-wide muted" style={{ margin: "-6px 0 4px" }}>
          {t(tx("أرفق صورة أو فيديو واكتب نصًا يظهر فوق الوسائط في الشريط المتحرك.", "Attach an image or video and write text that appears over the media in the moving reel."))}
        </p>
        <form onSubmit={save} style={{ display: "contents" }}>
          <div className="field-wide"><ImageField label={tx("الصورة/الرابط", "Image / URL")} value={form.media_url ?? ""} onChange={(url) => setForm({ ...form, media_url: url })} /></div>
          <Field label={tx("النوع", "Type")}><select value={form.media_type} onChange={(e) => setForm({ ...form, media_type: e.target.value as NursingMedia["media_type"] })}><option value="image">{t(tx("صورة", "Image"))}</option><option value="video">{t(tx("فيديو", "Video"))}</option></select></Field>
          <Field label={tx("الترتيب", "Order")}><input type="number" value={form.sort_order ?? 100} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></Field>
          <Field label={tx("النص على الوسائط (عربي)", "Text on media (AR)")}><input value={form.caption_ar ?? ""} onChange={(e) => setForm({ ...form, caption_ar: e.target.value })} dir="auto" /></Field>
          <Field label={tx("النص على الوسائط (إنجليزي)", "Text on media (EN)")}><input value={form.caption_en ?? ""} onChange={(e) => setForm({ ...form, caption_en: e.target.value })} dir="auto" /></Field>
          <div className="field-wide"><CrudFormActions busy={busy} editing={editing} onCancel={() => setForm(emptyMedia())} /></div>
        </form>
      </div>

      <div className="admin-panel admin-table-wrap">
        <table className="admin-table">
          <thead><tr>
            <th>{t(tx("معاينة", "Preview"))}</th><th>{t(tx("النص", "Text"))}</th><th>{t(tx("النوع", "Type"))}</th>
            <th>{t(tx("الترتيب", "Order"))}</th><th>{t(tx("الحالة", "Status"))}</th><th>{t(tx("إجراءات", "Actions"))}</th>
          </tr></thead>
          <tbody>
            {rows === null ? <TableLoadingRows cols={6} /> : rows.length === 0 ? (
              <tr><td colSpan={6} className="muted">{t(tx("لا توجد وسائط.", "No media."))}</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id}>
                <td>
                  {row.media_type === "video"
                    ? <video src={row.media_url} muted preload="metadata" className="media-thumb" />
                    : <img src={row.media_url} alt="" loading="lazy" className="media-thumb" />}
                </td>
                <td>{t(tx(row.caption_ar || "", row.caption_en || "")) || "—"}</td>
                <td>{row.media_type === "video" ? t(tx("فيديو", "Video")) : t(tx("صورة", "Image"))}</td>
                <td className="mono">{row.sort_order}</td>
                <td><span className={`badge ${row.status === "published" ? "badge-success" : "badge-muted"}`}>{row.status === "published" ? t(tx("مُفعّل", "Active")) : t(tx("موقوف", "Inactive"))}</span></td>
                <td>
                  <button className="icon-button" onClick={() => toggleActive(row)} aria-label={t(tx("تفعيل/إيقاف", "Activate/Deactivate"))} title={t(tx("تفعيل/إيقاف", "Activate/Deactivate"))}>
                    {row.status === "published" ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button className="icon-button" onClick={() => setForm(row)} aria-label={t(tx("تعديل", "Edit"))}><Pencil size={16} /></button>
                  <button className="icon-button" onClick={() => requestDelete(row.id, t(tx(row.caption_ar || "الوسائط", row.caption_en || "media")))} aria-label={t(tx("حذف", "Delete"))}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {dialog}
    </>
  );
}

/* ---- Nurse of the Month spotlight --------------------------------------- */
const emptySpotlight = (): Partial<NursingSpotlight> => ({ is_active: true });

function SpotlightManager({ notify }: { notify: Notify }) {
  const { t } = usePortal();
  const [rows, setRows] = useState<NursingSpotlight[] | null>(null);
  const [form, setForm] = useState<Partial<NursingSpotlight>>(emptySpotlight);
  const [busy, setBusy] = useState(false);
  const editing = Boolean(form.id);
  const load = () => adminFetchSpotlight().then(setRows);
  useEffect(() => { load(); }, []);
  const { dialog, requestDelete } = useDeleteConfirm(async (id) => {
    const { error } = await adminDeleteSpotlight(id);
    if (error) return notify(error, "error");
    notify(t(tx("تم الحذف.", "Deleted.")), "success"); load();
  });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) return notify(t(tx("الاسم مطلوب.", "Name required.")), "error");
    setBusy(true);
    const { error } = await adminUpsertSpotlight(form);
    setBusy(false);
    if (error) return notify(error, "error");
    logAdminAction(editing ? "nursing.spotlight.update" : "nursing.spotlight.create", "nursing_spotlight", form.id ?? null);
    notify(t(tx("تم الحفظ.", "Saved.")), "success");
    setForm(emptySpotlight()); load();
  };
  const toggleActive = async (row: NursingSpotlight) => {
    const { error } = await adminUpsertSpotlight({ id: row.id, is_active: !row.is_active });
    if (error) return notify(error, "error");
    load();
  };
  return (
    <>
      <div className="admin-panel admin-form" style={{ marginBottom: 20 }}>
        <h2 className="field-wide" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Award size={18} /> {editing ? t(tx("تعديل ممرض الشهر", "Edit nurse of the month")) : t(tx("ممرض/ممرضة الشهر", "Nurse of the Month"))}
        </h2>
        <p className="field-wide muted" style={{ margin: "-6px 0 4px" }}>
          {t(tx(
            "الصورة والاسم والتخصص ونص التقدير تظهر على وجه البطاقة، وقائمة الإنجازات تظهر خلفها عند تمرير المؤشر. عدّلها في أي وقت لتحديث ممرض الشهر.",
            "Photo, name, specialty and appreciation appear on the card front; the achievements list shows on the back on hover. Edit anytime to update the month's nurse."
          ))}
        </p>
        <form onSubmit={save} style={{ display: "contents" }}>
          <div className="field-wide"><ImageField label={tx("صورة الممرض/ة", "Nurse photo")} value={form.photo_url ?? ""} onChange={(url) => setForm({ ...form, photo_url: url })} /></div>
          <Field label={tx("الاسم", "Name")}><input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} dir="auto" /></Field>
          <Field label={tx("التخصص", "Specialty")}><input value={form.specialty ?? ""} onChange={(e) => setForm({ ...form, specialty: e.target.value })} dir="auto" /></Field>
          <Field label={tx("عنوان الشهر (عربي)", "Month label (AR)")}><input value={form.month_label_ar ?? ""} onChange={(e) => setForm({ ...form, month_label_ar: e.target.value })} dir="auto" placeholder="ممرض شهر يوليو" /></Field>
          <Field label={tx("عنوان الشهر (إنجليزي)", "Month label (EN)")}><input value={form.month_label_en ?? ""} onChange={(e) => setForm({ ...form, month_label_en: e.target.value })} dir="auto" placeholder="Nurse of July" /></Field>
          <Field label={tx("نص التقدير (عربي)", "Appreciation (AR)")} wide><textarea value={form.message_ar ?? ""} onChange={(e) => setForm({ ...form, message_ar: e.target.value })} dir="auto" rows={2} /></Field>
          <Field label={tx("نص التقدير (إنجليزي)", "Appreciation (EN)")} wide><textarea value={form.message_en ?? ""} onChange={(e) => setForm({ ...form, message_en: e.target.value })} dir="auto" rows={2} /></Field>
          <Field label={tx("الإنجازات (سطر لكل إنجاز — عربي)", "Achievements (one per line — AR)")} wide><textarea value={form.achievements_ar ?? ""} onChange={(e) => setForm({ ...form, achievements_ar: e.target.value })} dir="auto" rows={4} /></Field>
          <Field label={tx("الإنجازات (سطر لكل إنجاز — إنجليزي)", "Achievements (one per line — EN)")} wide><textarea value={form.achievements_en ?? ""} onChange={(e) => setForm({ ...form, achievements_en: e.target.value })} dir="auto" rows={4} /></Field>
          <label className="field-wide" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
            <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} style={{ width: 18, height: 18 }} />
            {t(tx("نشط (يظهر على صفحة التمريض)", "Active (shown on the nursing page)"))}
          </label>
          <div className="field-wide"><CrudFormActions busy={busy} editing={editing} onCancel={() => setForm(emptySpotlight())} /></div>
        </form>
      </div>

      <div className="admin-panel admin-table-wrap">
        <table className="admin-table">
          <thead><tr>
            <th>{t(tx("الصورة", "Photo"))}</th><th>{t(tx("الاسم", "Name"))}</th><th>{t(tx("التخصص", "Specialty"))}</th>
            <th>{t(tx("الشهر", "Month"))}</th><th>{t(tx("الحالة", "Status"))}</th><th>{t(tx("إجراءات", "Actions"))}</th>
          </tr></thead>
          <tbody>
            {rows === null ? <TableLoadingRows cols={6} /> : rows.length === 0 ? (
              <tr><td colSpan={6} className="muted">{t(tx("لم يُضف ممرض الشهر بعد.", "No nurse of the month yet."))}</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id}>
                <td>{row.photo_url ? <img src={row.photo_url} alt="" loading="lazy" className="media-thumb media-thumb-round" /> : <span className="muted">—</span>}</td>
                <td>{row.name}</td>
                <td>{row.specialty || "—"}</td>
                <td>{t(tx(row.month_label_ar || "", row.month_label_en || "")) || "—"}</td>
                <td><span className={`badge ${row.is_active ? "badge-success" : "badge-muted"}`}>{row.is_active ? t(tx("نشط", "Active")) : t(tx("متوقف", "Inactive"))}</span></td>
                <td>
                  <button className="icon-button" onClick={() => toggleActive(row)} aria-label={t(tx("تفعيل/إيقاف", "Activate/Deactivate"))} title={t(tx("تفعيل/إيقاف", "Activate/Deactivate"))}>
                    {row.is_active ? <EyeOff size={16} /> : <Sparkles size={16} />}
                  </button>
                  <button className="icon-button" onClick={() => setForm(row)} aria-label={t(tx("تعديل", "Edit"))}><Pencil size={16} /></button>
                  <button className="icon-button" onClick={() => requestDelete(row.id, row.name)} aria-label={t(tx("حذف", "Delete"))}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {dialog}
    </>
  );
}

/* ---- Policies ----------------------------------------------------------- */
function PoliciesManager({ notify }: { notify: Notify }) {
  const { t } = usePortal();
  const [rows, setRows] = useState<NursingPolicy[] | null>(null);
  const [form, setForm] = useState<Partial<NursingPolicy>>({ status: "published", sort_order: 100 });
  const [busy, setBusy] = useState(false);
  const editing = Boolean(form.id);
  const load = () => adminFetchPolicies().then(setRows);
  useEffect(() => { load(); }, []);
  const { dialog, requestDelete } = useDeleteConfirm(async (id) => {
    const { error } = await adminDeletePolicy(id);
    if (error) return notify(error, "error");
    notify(t(tx("تم الحذف.", "Deleted.")), "success"); load();
  });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title_ar?.trim() || !form.title_en?.trim()) return notify(t(tx("العنوان مطلوب.", "Title required.")), "error");
    setBusy(true);
    const { error } = await adminUpsertPolicy(form);
    setBusy(false);
    if (error) return notify(error, "error");
    notify(t(tx("تم الحفظ.", "Saved.")), "success");
    setForm({ status: "published", sort_order: 100 }); load();
  };
  return (
    <>
      <div className="admin-panel admin-form" style={{ marginBottom: 20 }}>
        <h2 className="field-wide">{editing ? t(tx("تعديل سياسة", "Edit policy")) : t(tx("إضافة سياسة", "Add policy"))}</h2>
        <form onSubmit={save} style={{ display: "contents" }}>
          <Field label={tx("العنوان (عربي)", "Title (AR)")}><input value={form.title_ar ?? ""} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} dir="auto" /></Field>
          <Field label={tx("العنوان (إنجليزي)", "Title (EN)")}><input value={form.title_en ?? ""} onChange={(e) => setForm({ ...form, title_en: e.target.value })} dir="auto" /></Field>
          <Field label={tx("التصنيف (عربي)", "Category (AR)")}><input value={form.category_ar ?? ""} onChange={(e) => setForm({ ...form, category_ar: e.target.value })} dir="auto" /></Field>
          <Field label={tx("التصنيف (إنجليزي)", "Category (EN)")}><input value={form.category_en ?? ""} onChange={(e) => setForm({ ...form, category_en: e.target.value })} dir="auto" /></Field>
          <Field label={tx("رابط الملف (اختياري)", "File link (optional)")}><input value={form.file_url ?? ""} onChange={(e) => setForm({ ...form, file_url: e.target.value })} dir="auto" /></Field>
          <Field label={tx("الحالة", "Status")}><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as NursingPolicy["status"] })}><option value="draft">{t(tx("مسودة", "Draft"))}</option><option value="published">{t(tx("منشور", "Published"))}</option><option value="archived">{t(tx("مؤرشف", "Archived"))}</option></select></Field>
          <Field label={tx("النص (عربي)", "Body (AR)")} wide><textarea value={form.body_ar ?? ""} onChange={(e) => setForm({ ...form, body_ar: e.target.value })} dir="auto" /></Field>
          <Field label={tx("النص (إنجليزي)", "Body (EN)")} wide><textarea value={form.body_en ?? ""} onChange={(e) => setForm({ ...form, body_en: e.target.value })} dir="auto" /></Field>
          <div className="field-wide" style={{ display: "flex", gap: 10 }}><CrudFormActions busy={busy} editing={editing} onCancel={() => setForm({ status: "published", sort_order: 100 })} /></div>
        </form>
      </div>
      <div className="admin-panel admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>{t(tx("العنوان", "Title"))}</th><th>{t(tx("التصنيف", "Category"))}</th><th>{t(tx("الحالة", "Status"))}</th><th>{t(tx("إجراءات", "Actions"))}</th></tr></thead>
          <tbody>
            {rows === null ? <TableLoadingRows cols={4} /> : rows.length === 0 ? (
              <tr><td colSpan={4} className="muted">{t(tx("لا توجد سياسات.", "No policies."))}</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id}>
                <td>{t(tx(row.title_ar, row.title_en))}</td>
                <td>{t(tx(row.category_ar || "", row.category_en || "")) || "—"}</td>
                <td><span className={`badge ${row.status === "published" ? "badge-success" : "badge-muted"}`}>{row.status}</span></td>
                <td>
                  <button className="icon-button" onClick={() => setForm(row)}><Pencil size={16} /></button>
                  <button className="icon-button" onClick={() => requestDelete(row.id, t(tx(row.title_ar, row.title_en)))}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {dialog}
    </>
  );
}

/* ---- Vacations inbox ---------------------------------------------------- */
function VacationsInbox({ notify }: { notify: Notify }) {
  const { t } = usePortal();
  const [rows, setRows] = useState<VacationPlan[] | null>(null);
  const load = () => adminFetchVacations().then(setRows);
  useEffect(() => { load(); }, []);
  const act = async (id: string, status: string) => {
    let note: string | undefined;
    if (status === "returned") note = window.prompt(t(tx("سبب الإعادة (اختياري):", "Reason for return (optional):"))) || undefined;
    const { error } = await adminSetVacationStatus(id, status, note);
    if (error) return notify(error, "error");
    load();
  };
  return (
    <div className="admin-panel admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>{t(tx("من", "From"))}</th><th>{t(tx("إلى", "To"))}</th><th>{t(tx("الأيام", "Days"))}</th><th>{t(tx("الحالة", "Status"))}</th><th>{t(tx("إجراء", "Action"))}</th></tr></thead>
        <tbody>
          {rows === null ? <TableLoadingRows cols={5} /> : rows.length === 0 ? (
            <tr><td colSpan={5} className="muted">{t(tx("لا توجد طلبات.", "No requests."))}</td></tr>
          ) : rows.map((v) => (
            <tr key={v.id}>
              <td className="mono">{v.start_date}</td><td className="mono">{v.end_date}</td><td>{v.days ?? "—"}</td>
              <td><span className={`badge ${v.status === "approved" ? "badge-success" : v.status === "returned" ? "badge-info" : "badge-warning"}`}>{v.status}</span></td>
              <td>
                <button className="btn btn-secondary" style={{ minHeight: 34, padding: "0 12px" }} onClick={() => act(v.id, "approved")}>{t(tx("اعتماد", "Approve"))}</button>
                <button className="btn btn-ghost" style={{ minHeight: 34, padding: "0 12px" }} onClick={() => act(v.id, "returned")}>{t(tx("إعادة", "Return"))}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---- Profile approvals -------------------------------------------------- */
function ProfilesInbox({ notify }: { notify: Notify }) {
  const { t } = usePortal();
  const [rows, setRows] = useState<ProfileItem[] | null>(null);
  const load = () => adminFetchProfileItems().then(setRows);
  useEffect(() => { load(); }, []);
  const act = async (id: string, status: string) => {
    const { error } = await adminSetProfileStatus(id, status);
    if (error) return notify(error, "error");
    load();
  };
  return (
    <div className="admin-panel admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>{t(tx("النوع", "Type"))}</th><th>{t(tx("العنوان", "Title"))}</th><th>{t(tx("الانتهاء", "Expiry"))}</th><th>{t(tx("الحالة", "Status"))}</th><th>{t(tx("إجراء", "Action"))}</th></tr></thead>
        <tbody>
          {rows === null ? <TableLoadingRows cols={5} /> : rows.length === 0 ? (
            <tr><td colSpan={5} className="muted">{t(tx("لا توجد وثائق.", "No documents."))}</td></tr>
          ) : rows.map((p) => (
            <tr key={p.id}>
              <td>{p.kind}</td><td>{p.title}</td><td className="mono">{p.expiry_date || "—"}</td>
              <td><span className={`badge ${p.status === "approved" ? "badge-success" : p.status === "rejected" ? "badge-danger" : "badge-warning"}`}>{p.status}</span></td>
              <td>
                <button className="btn btn-secondary" style={{ minHeight: 34, padding: "0 12px" }} onClick={() => act(p.id, "approved")}>{t(tx("اعتماد", "Approve"))}</button>
                <button className="btn btn-ghost" style={{ minHeight: 34, padding: "0 12px" }} onClick={() => act(p.id, "rejected")}>{t(tx("رفض", "Reject"))}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
