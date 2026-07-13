import { useEffect, useState } from "react";
import { KeyRound, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { logAdminAction } from "../../lib/audit";
import { tx } from "../../utils/i18n";
import {
  adminDeleteMedia,
  adminDeletePolicy,
  adminFetchMedia,
  adminFetchPolicies,
  adminFetchProfileItems,
  adminFetchStaff,
  adminFetchVacations,
  adminResetPin,
  adminSetManager,
  adminSetProfileStatus,
  adminSetVacationStatus,
  adminUpsertMedia,
  adminUpsertPolicy,
  adminUpsertStaff,
  type NursingMedia,
  type NursingPolicy,
  type NursingStaffAdmin,
  type ProfileItem,
  type VacationPlan
} from "../../lib/supabase/nursing";
import { CrudFormActions, Field, TableLoadingRows, useDeleteConfirm } from "./shared";
import { ImageField } from "./ImageField";

type Tab = "staff" | "media" | "policies" | "vacations" | "profiles";
type Notify = (m: string, tone?: "success" | "error" | "info") => void;

export function AdminNursing() {
  const { t, notify } = usePortal();
  const [tab, setTab] = useState<Tab>("staff");
  const tabs: [Tab, ReturnType<typeof tx>][] = [
    ["staff", tx("الكادر", "Staff")],
    ["media", tx("الوسائط", "Media")],
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
        <span className="muted">{filtered.length} {t(tx("موظف", "staff"))}</span>
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
    </>
  );
}

/* ---- Media -------------------------------------------------------------- */
function MediaManager({ notify }: { notify: Notify }) {
  const { t } = usePortal();
  const [rows, setRows] = useState<NursingMedia[] | null>(null);
  const [form, setForm] = useState<Partial<NursingMedia>>({ media_type: "image", status: "published", sort_order: 100 });
  const [busy, setBusy] = useState(false);
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
    notify(t(tx("تم الحفظ.", "Saved.")), "success");
    setForm({ media_type: "image", status: "published", sort_order: 100 }); load();
  };
  return (
    <>
      <div className="admin-panel admin-form" style={{ marginBottom: 20 }}>
        <h2 className="field-wide">{t(tx("إضافة وسائط", "Add media"))}</h2>
        <form onSubmit={save} style={{ display: "contents" }}>
          <div className="field-wide"><ImageField label={tx("الصورة/الرابط", "Image / URL")} value={form.media_url ?? ""} onChange={(url) => setForm({ ...form, media_url: url })} /></div>
          <Field label={tx("النوع", "Type")}><select value={form.media_type} onChange={(e) => setForm({ ...form, media_type: e.target.value as NursingMedia["media_type"] })}><option value="image">{t(tx("صورة", "Image"))}</option><option value="video">{t(tx("فيديو", "Video"))}</option></select></Field>
          <Field label={tx("التعليق (عربي)", "Caption (AR)")}><input value={form.caption_ar ?? ""} onChange={(e) => setForm({ ...form, caption_ar: e.target.value })} dir="auto" /></Field>
          <Field label={tx("التعليق (إنجليزي)", "Caption (EN)")}><input value={form.caption_en ?? ""} onChange={(e) => setForm({ ...form, caption_en: e.target.value })} dir="auto" /></Field>
          <div className="field-wide"><CrudFormActions busy={busy} editing={false} onCancel={() => setForm({ media_type: "image", status: "published", sort_order: 100 })} /></div>
        </form>
      </div>
      {rows && rows.length > 0 ? (
        <div className="training-gallery">
          {rows.map((row) => (
            <figure className="gallery-item" key={row.id} style={{ position: "relative" }}>
              {row.media_type === "video" ? <video src={row.media_url} controls preload="metadata" /> : <img src={row.media_url} alt="" loading="lazy" />}
              <button className="icon-button" style={{ position: "absolute", insetInlineEnd: 8, insetBlockStart: 8 }} onClick={() => requestDelete(row.id, row.media_url)}><Trash2 size={16} /></button>
            </figure>
          ))}
        </div>
      ) : <div className="admin-panel muted">{t(tx("لا توجد وسائط.", "No media."))}</div>}
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
