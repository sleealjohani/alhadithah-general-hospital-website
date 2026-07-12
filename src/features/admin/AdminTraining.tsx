import { useEffect, useMemo, useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { logAdminAction } from "../../lib/audit";
import { tx } from "../../utils/i18n";
import {
  deleteCourse,
  deleteMedia,
  fetchAllCourses,
  fetchAllMedia,
  fetchHostRequests,
  fetchRegistrations,
  updateHostRequestStatus,
  upsertCourse,
  upsertMedia,
  type TrainingCourse,
  type TrainingHostRequest,
  type TrainingMedia,
  type TrainingRegistration
} from "../../lib/supabase/training";
import { CrudFormActions, Field, TableLoadingRows, useDeleteConfirm } from "./shared";
import { ImageField } from "./ImageField";

type Tab = "courses" | "media" | "registrations" | "requests";

const EMPTY_COURSE: Partial<TrainingCourse> = {
  title_ar: "",
  title_en: "",
  audience: "both",
  status: "published",
  sort_order: 100
};

const EMPTY_MEDIA: Partial<TrainingMedia> = {
  title_ar: "",
  title_en: "",
  media_url: "",
  media_type: "image",
  status: "published",
  sort_order: 100
};

/* datetime-local <-> ISO helpers */
function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export function AdminTraining() {
  const { t, notify } = usePortal();
  const [tab, setTab] = useState<Tab>("courses");

  return (
    <div className="admin-page">
      <SectionHeading
        title={tx("الشؤون الأكاديمية والتدريب", "Academic Affairs & Training")}
        description={tx(
          "أدر الدورات والوسائط، واطّلع على تسجيلات المقاعد وطلبات إقامة الدورات.",
          "Manage courses and media, and review seat registrations and course-hosting requests."
        )}
      />

      <div className="tab-row" role="tablist">
        <button type="button" className={tab === "courses" ? "is-active" : ""} onClick={() => setTab("courses")}>
          {t(tx("الدورات", "Courses"))}
        </button>
        <button type="button" className={tab === "media" ? "is-active" : ""} onClick={() => setTab("media")}>
          {t(tx("الوسائط", "Media"))}
        </button>
        <button type="button" className={tab === "registrations" ? "is-active" : ""} onClick={() => setTab("registrations")}>
          {t(tx("التسجيلات", "Registrations"))}
        </button>
        <button type="button" className={tab === "requests" ? "is-active" : ""} onClick={() => setTab("requests")}>
          {t(tx("طلبات إقامة دورة", "Hosting requests"))}
        </button>
      </div>

      {tab === "courses" ? <CoursesManager notify={notify} /> : null}
      {tab === "media" ? <MediaManager notify={notify} /> : null}
      {tab === "registrations" ? <RegistrationsInbox /> : null}
      {tab === "requests" ? <RequestsInbox notify={notify} /> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Courses                                                                     */
/* -------------------------------------------------------------------------- */

function CoursesManager({ notify }: { notify: (m: string, tone?: "success" | "error" | "info") => void }) {
  const { t } = usePortal();
  const [rows, setRows] = useState<TrainingCourse[] | null>(null);
  const [form, setForm] = useState<Partial<TrainingCourse>>(EMPTY_COURSE);
  const [busy, setBusy] = useState(false);
  const editing = Boolean(form.id);

  const load = () => fetchAllCourses().then(setRows);
  useEffect(() => {
    load();
  }, []);

  const { dialog, requestDelete } = useDeleteConfirm(async (id) => {
    const { error } = await deleteCourse(id);
    if (error) return notify(error, "error");
    logAdminAction("training.course.delete", "training_courses", id);
    notify(t(tx("تم حذف الدورة.", "Course deleted.")), "success");
    load();
  });

  const set = (patch: Partial<TrainingCourse>) => setForm((prev) => ({ ...prev, ...patch }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title_ar?.trim() || !form.title_en?.trim()) {
      return notify(t(tx("العنوان بالعربية والإنجليزية مطلوب.", "Arabic and English titles are required.")), "error");
    }
    setBusy(true);
    const { error } = await upsertCourse({ ...form, sort_order: Number(form.sort_order) || 100 });
    setBusy(false);
    if (error) return notify(error, "error");
    logAdminAction(editing ? "training.course.update" : "training.course.create", "training_courses", form.id ?? null);
    notify(t(tx("تم حفظ الدورة.", "Course saved.")), "success");
    setForm(EMPTY_COURSE);
    load();
  };

  return (
    <>
      <div className="admin-panel admin-form" style={{ marginBottom: 22 }}>
        <h2 className="field-wide">{editing ? t(tx("تعديل دورة", "Edit course")) : t(tx("إضافة دورة", "Add course"))}</h2>
        <form className="admin-form field-wide" onSubmit={save} style={{ display: "contents" }}>
          <Field label={tx("العنوان (عربي)", "Title (Arabic)")}>
            <input value={form.title_ar ?? ""} onChange={(e) => set({ title_ar: e.target.value })} dir="auto" />
          </Field>
          <Field label={tx("العنوان (إنجليزي)", "Title (English)")}>
            <input value={form.title_en ?? ""} onChange={(e) => set({ title_en: e.target.value })} dir="auto" />
          </Field>
          <Field label={tx("المحاضر (عربي)", "Lecturer (Arabic)")}>
            <input value={form.lecturer_ar ?? ""} onChange={(e) => set({ lecturer_ar: e.target.value })} dir="auto" />
          </Field>
          <Field label={tx("المحاضر (إنجليزي)", "Lecturer (English)")}>
            <input value={form.lecturer_en ?? ""} onChange={(e) => set({ lecturer_en: e.target.value })} dir="auto" />
          </Field>
          <Field label={tx("المكان (عربي)", "Location (Arabic)")}>
            <input value={form.location_ar ?? ""} onChange={(e) => set({ location_ar: e.target.value })} dir="auto" />
          </Field>
          <Field label={tx("المكان (إنجليزي)", "Location (English)")}>
            <input value={form.location_en ?? ""} onChange={(e) => set({ location_en: e.target.value })} dir="auto" />
          </Field>
          <Field label={tx("يبدأ", "Starts")}>
            <input type="datetime-local" value={toLocalInput(form.starts_at)} onChange={(e) => set({ starts_at: fromLocalInput(e.target.value) })} />
          </Field>
          <Field label={tx("ينتهي", "Ends")}>
            <input type="datetime-local" value={toLocalInput(form.ends_at)} onChange={(e) => set({ ends_at: fromLocalInput(e.target.value) })} />
          </Field>
          <Field label={tx("الفئة", "Audience")}>
            <select value={form.audience ?? "both"} onChange={(e) => set({ audience: e.target.value as TrainingCourse["audience"] })}>
              <option value="employees">{t(tx("الموظفون", "Employees"))}</option>
              <option value="public">{t(tx("العموم", "Public"))}</option>
              <option value="both">{t(tx("الجميع", "Everyone"))}</option>
            </select>
          </Field>
          <Field label={tx("الحالة", "Status")}>
            <select value={form.status ?? "published"} onChange={(e) => set({ status: e.target.value as TrainingCourse["status"] })}>
              <option value="draft">{t(tx("مسودة", "Draft"))}</option>
              <option value="published">{t(tx("منشور", "Published"))}</option>
              <option value="archived">{t(tx("مؤرشف", "Archived"))}</option>
            </select>
          </Field>
          <Field label={tx("السعة (اختياري)", "Capacity (optional)")}>
            <input type="number" value={form.capacity ?? ""} onChange={(e) => set({ capacity: e.target.value ? Number(e.target.value) : null })} />
          </Field>
          <Field label={tx("الترتيب", "Sort order")}>
            <input type="number" value={form.sort_order ?? 100} onChange={(e) => set({ sort_order: Number(e.target.value) })} />
          </Field>
          <div className="field-wide">
            <ImageField label={tx("ملصق الدورة", "Course poster")} value={form.poster_url ?? ""} onChange={(url) => set({ poster_url: url })} />
          </div>
          <Field label={tx("الوصف (عربي)", "Description (Arabic)")} wide>
            <textarea value={form.description_ar ?? ""} onChange={(e) => set({ description_ar: e.target.value })} dir="auto" />
          </Field>
          <Field label={tx("الوصف (إنجليزي)", "Description (English)")} wide>
            <textarea value={form.description_en ?? ""} onChange={(e) => set({ description_en: e.target.value })} dir="auto" />
          </Field>
          <div className="field-wide" style={{ display: "flex", gap: 10 }}>
            <CrudFormActions busy={busy} editing={editing} onCancel={() => setForm(EMPTY_COURSE)} />
          </div>
        </form>
      </div>

      <div className="admin-panel admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t(tx("العنوان", "Title"))}</th>
              <th>{t(tx("التاريخ", "Date"))}</th>
              <th>{t(tx("الفئة", "Audience"))}</th>
              <th>{t(tx("الحالة", "Status"))}</th>
              <th>{t(tx("إجراءات", "Actions"))}</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <TableLoadingRows cols={5} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">{t(tx("لا توجد دورات بعد.", "No courses yet."))}</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{t(tx(row.title_ar, row.title_en))}</td>
                  <td className="mono">{row.starts_at ? row.starts_at.slice(0, 10) : "—"}</td>
                  <td><span className="badge badge-info">{row.audience}</span></td>
                  <td><span className={`badge ${row.status === "published" ? "badge-success" : "badge-muted"}`}>{row.status}</span></td>
                  <td>
                    <button className="icon-button" onClick={() => setForm(row)} aria-label={t(tx("تعديل", "Edit"))}><Pencil size={16} /></button>
                    <button className="icon-button" onClick={() => requestDelete(row.id, t(tx(row.title_ar, row.title_en)))} aria-label={t(tx("حذف", "Delete"))}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {dialog}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Media                                                                       */
/* -------------------------------------------------------------------------- */

function MediaManager({ notify }: { notify: (m: string, tone?: "success" | "error" | "info") => void }) {
  const { t } = usePortal();
  const [rows, setRows] = useState<TrainingMedia[] | null>(null);
  const [form, setForm] = useState<Partial<TrainingMedia>>(EMPTY_MEDIA);
  const [busy, setBusy] = useState(false);
  const editing = Boolean(form.id);
  const load = () => fetchAllMedia().then(setRows);
  useEffect(() => {
    load();
  }, []);

  const { dialog, requestDelete } = useDeleteConfirm(async (id) => {
    const { error } = await deleteMedia(id);
    if (error) return notify(error, "error");
    logAdminAction("training.media.delete", "training_media", id);
    notify(t(tx("تم الحذف.", "Deleted.")), "success");
    load();
  });

  const set = (patch: Partial<TrainingMedia>) => setForm((prev) => ({ ...prev, ...patch }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.media_url?.trim()) return notify(t(tx("رابط الوسائط مطلوب.", "Media URL is required.")), "error");
    setBusy(true);
    const { error } = await upsertMedia({ ...form, sort_order: Number(form.sort_order) || 100 });
    setBusy(false);
    if (error) return notify(error, "error");
    logAdminAction(editing ? "training.media.update" : "training.media.create", "training_media", form.id ?? null);
    notify(t(tx("تم حفظ الوسائط.", "Media saved.")), "success");
    setForm(EMPTY_MEDIA);
    load();
  };

  return (
    <>
      <div className="admin-panel admin-form" style={{ marginBottom: 22 }}>
        <h2 className="field-wide">{editing ? t(tx("تعديل وسائط", "Edit media")) : t(tx("إضافة وسائط", "Add media"))}</h2>
        <form onSubmit={save} style={{ display: "contents" }}>
          <div className="field-wide">
            <ImageField label={tx("الصورة/الرابط", "Image / URL")} value={form.media_url ?? ""} onChange={(url) => set({ media_url: url })} />
          </div>
          <Field label={tx("النوع", "Type")}>
            <select value={form.media_type ?? "image"} onChange={(e) => set({ media_type: e.target.value as TrainingMedia["media_type"] })}>
              <option value="image">{t(tx("صورة", "Image"))}</option>
              <option value="video">{t(tx("فيديو", "Video"))}</option>
            </select>
          </Field>
          <Field label={tx("الحالة", "Status")}>
            <select value={form.status ?? "published"} onChange={(e) => set({ status: e.target.value as TrainingMedia["status"] })}>
              <option value="draft">{t(tx("مسودة", "Draft"))}</option>
              <option value="published">{t(tx("منشور", "Published"))}</option>
              <option value="archived">{t(tx("مؤرشف", "Archived"))}</option>
            </select>
          </Field>
          <Field label={tx("التعليق (عربي)", "Caption (Arabic)")}>
            <input value={form.caption_ar ?? ""} onChange={(e) => set({ caption_ar: e.target.value })} dir="auto" />
          </Field>
          <Field label={tx("التعليق (إنجليزي)", "Caption (English)")}>
            <input value={form.caption_en ?? ""} onChange={(e) => set({ caption_en: e.target.value })} dir="auto" />
          </Field>
          <Field label={tx("الترتيب", "Sort order")}>
            <input type="number" value={form.sort_order ?? 100} onChange={(e) => set({ sort_order: Number(e.target.value) })} />
          </Field>
          <div className="field-wide" style={{ display: "flex", gap: 10 }}>
            <CrudFormActions busy={busy} editing={editing} onCancel={() => setForm(EMPTY_MEDIA)} />
          </div>
        </form>
      </div>

      {rows === null ? (
        <div className="admin-panel muted">{t(tx("جارٍ التحميل…", "Loading…"))}</div>
      ) : rows.length === 0 ? (
        <div className="admin-panel muted">{t(tx("لا توجد وسائط بعد.", "No media yet."))}</div>
      ) : (
        <div className="training-gallery">
          {rows.map((row) => (
            <figure className="gallery-item" key={row.id} style={{ position: "relative" }}>
              {row.media_type === "video" ? <video src={row.media_url} controls preload="metadata" /> : <img src={row.media_url} alt="" loading="lazy" />}
              <button className="icon-button" style={{ position: "absolute", insetInlineEnd: 8, insetBlockStart: 8 }} onClick={() => requestDelete(row.id, row.media_url)} aria-label={t(tx("حذف", "Delete"))}>
                <Trash2 size={16} />
              </button>
              {row.caption_ar || row.caption_en ? <figcaption>{t(tx(row.caption_ar || "", row.caption_en || ""))}</figcaption> : null}
            </figure>
          ))}
        </div>
      )}
      {dialog}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Registrations inbox (read-only)                                             */
/* -------------------------------------------------------------------------- */

function RegistrationsInbox() {
  const { t } = usePortal();
  const [rows, setRows] = useState<TrainingRegistration[] | null>(null);
  useEffect(() => {
    fetchRegistrations().then(setRows);
  }, []);

  return (
    <div className="admin-panel admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>{t(tx("الاسم", "Name"))}</th>
            <th>{t(tx("الجوال", "Phone"))}</th>
            <th>{t(tx("الدورة", "Course"))}</th>
            <th>{t(tx("التاريخ", "Submitted"))}</th>
          </tr>
        </thead>
        <tbody>
          {rows === null ? (
            <TableLoadingRows cols={4} />
          ) : rows.length === 0 ? (
            <tr><td colSpan={4} className="muted">{t(tx("لا توجد تسجيلات بعد.", "No registrations yet."))}</td></tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td>{row.full_name}</td>
                <td className="mono">{row.phone}</td>
                <td>{row.course_title || "—"}</td>
                <td className="mono">{row.created_at.slice(0, 10)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Hosting requests inbox (status update)                                      */
/* -------------------------------------------------------------------------- */

function RequestsInbox({ notify }: { notify: (m: string, tone?: "success" | "error" | "info") => void }) {
  const { t } = usePortal();
  const [rows, setRows] = useState<TrainingHostRequest[] | null>(null);
  const load = () => fetchHostRequests().then(setRows);
  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await updateHostRequestStatus(id, status);
    if (error) return notify(error, "error");
    setRows((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, status } : r)) : prev));
  };

  const statuses = useMemo(
    () => [
      { value: "new", label: tx("جديد", "New") },
      { value: "reviewing", label: tx("قيد المراجعة", "Reviewing") },
      { value: "approved", label: tx("مقبول", "Approved") },
      { value: "declined", label: tx("مرفوض", "Declined") }
    ],
    []
  );

  return (
    <div className="admin-panel admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>{t(tx("الدورة", "Course"))}</th>
            <th>{t(tx("المحاضر", "Lecturer"))}</th>
            <th>{t(tx("الجوال", "Phone"))}</th>
            <th>{t(tx("التاريخ المقترح", "Preferred date"))}</th>
            <th>{t(tx("الحالة", "Status"))}</th>
          </tr>
        </thead>
        <tbody>
          {rows === null ? (
            <TableLoadingRows cols={5} />
          ) : rows.length === 0 ? (
            <tr><td colSpan={5} className="muted">{t(tx("لا توجد طلبات بعد.", "No requests yet."))}</td></tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td>{row.course_name}</td>
                <td>{row.lecturers}</td>
                <td className="mono">{row.phone}</td>
                <td className="mono">{row.preferred_date || "—"}</td>
                <td>
                  <select value={row.status} onChange={(e) => setStatus(row.id, e.target.value)}>
                    {statuses.map((s) => (
                      <option key={s.value} value={s.value}>{t(s.label)}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
