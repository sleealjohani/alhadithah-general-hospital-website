import { useEffect, useMemo, useState } from "react";
import { ArrowRightCircle, Download, Trash2, Pencil, Users } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { Modal } from "../../components/ui/Modal";
import { logAdminAction } from "../../lib/audit";
import { exportRowsToExcel } from "../../lib/exports";
import { tx } from "../../utils/i18n";
import {
  convertHostRequestToCourse,
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

/* Flat, Excel-friendly rows for participant export. */
function registrationExportRows(rows: TrainingRegistration[]) {
  return rows.map((r) => ({
    Name: r.full_name,
    Phone: r.phone,
    Email: r.email ?? "",
    "National ID": r.national_id ?? "",
    "Job / Org": r.job_title ?? "",
    Course: r.course_title ?? "",
    Audience: r.audience ?? "",
    Status: r.status,
    Submitted: r.created_at ? r.created_at.slice(0, 16).replace("T", " ") : ""
  }));
}

/* Participants of a single course, with export. */
function ParticipantsModal({
  course,
  registrations,
  onClose
}: {
  course: TrainingCourse;
  registrations: TrainingRegistration[];
  onClose: () => void;
}) {
  const { t } = usePortal();
  const title = t(tx(course.title_ar, course.title_en));
  return (
    <Modal title={`${t(tx("المشاركون", "Participants"))} — ${title}`} onClose={onClose} wide>
      <div className="participants-head">
        <strong>
          {registrations.length} {t(tx("مشارك", "registered"))}
          {course.capacity ? ` / ${course.capacity}` : ""}
        </strong>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={registrations.length === 0}
          onClick={() => exportRowsToExcel(`participants-${title}`, registrationExportRows(registrations))}
        >
          <Download size={16} />
          {t(tx("تصدير Excel", "Export Excel"))}
        </button>
      </div>
      {registrations.length === 0 ? (
        <p className="muted">{t(tx("لا يوجد مشاركون بعد.", "No participants yet."))}</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t(tx("الاسم", "Name"))}</th>
                <th>{t(tx("الجوال", "Phone"))}</th>
                <th>{t(tx("البريد", "Email"))}</th>
                <th>{t(tx("الهوية", "National ID"))}</th>
                <th>{t(tx("الجهة", "Job / Org"))}</th>
                <th>{t(tx("التاريخ", "Date"))}</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id}>
                  <td>{r.full_name}</td>
                  <td className="mono">{r.phone}</td>
                  <td>{r.email || "—"}</td>
                  <td className="mono">{r.national_id || "—"}</td>
                  <td>{r.job_title || "—"}</td>
                  <td className="mono">{r.created_at.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

export function AdminTraining() {
  const { t, notify } = usePortal();
  const [tab, setTab] = useState<Tab>("courses");
  /* When a hosting request is approved it becomes a draft course; we jump to
     the Courses tab and open that draft so its details can be completed. */
  const [focusCourseId, setFocusCourseId] = useState<string | null>(null);

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

      {tab === "courses" ? (
        <CoursesManager notify={notify} focusCourseId={focusCourseId} onFocusHandled={() => setFocusCourseId(null)} />
      ) : null}
      {tab === "media" ? <MediaManager notify={notify} /> : null}
      {tab === "registrations" ? <RegistrationsInbox /> : null}
      {tab === "requests" ? (
        <RequestsInbox
          notify={notify}
          onConverted={(courseId) => {
            setFocusCourseId(courseId);
            setTab("courses");
          }}
        />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Courses                                                                     */
/* -------------------------------------------------------------------------- */

function CoursesManager({
  notify,
  focusCourseId,
  onFocusHandled
}: {
  notify: (m: string, tone?: "success" | "error" | "info") => void;
  focusCourseId?: string | null;
  onFocusHandled?: () => void;
}) {
  const { t } = usePortal();
  const [rows, setRows] = useState<TrainingCourse[] | null>(null);
  const [regs, setRegs] = useState<TrainingRegistration[]>([]);
  const [form, setForm] = useState<Partial<TrainingCourse>>(EMPTY_COURSE);
  const [busy, setBusy] = useState(false);
  const [viewCourse, setViewCourse] = useState<TrainingCourse | null>(null);
  const editing = Boolean(form.id);

  const load = () => {
    fetchAllCourses().then(setRows);
    fetchRegistrations().then(setRegs);
  };
  useEffect(() => {
    load();
  }, []);

  /* A freshly-approved hosting request lands here — open it for completion. */
  useEffect(() => {
    if (!focusCourseId || !rows) return;
    const target = rows.find((r) => r.id === focusCourseId);
    if (target) {
      setForm(target);
      onFocusHandled?.();
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [focusCourseId, rows, onFocusHandled]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    regs.forEach((r) => {
      if (r.course_id) map[r.course_id] = (map[r.course_id] ?? 0) + 1;
    });
    return map;
  }, [regs]);

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
              <th>{t(tx("المسجّلون", "Booked"))}</th>
              <th>{t(tx("الحالة", "Status"))}</th>
              <th>{t(tx("إجراءات", "Actions"))}</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <TableLoadingRows cols={5} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">{t(tx("لا توجد دورات بعد.", "No courses yet."))}</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{t(tx(row.title_ar, row.title_en))}</td>
                  <td className="mono">{row.starts_at ? row.starts_at.slice(0, 10) : "—"}</td>
                  <td><span className="badge badge-info">{row.audience}</span></td>
                  <td>
                    <button className="booked-pill" onClick={() => setViewCourse(row)} title={t(tx("عرض المشاركين", "View participants"))}>
                      <Users size={14} />
                      {counts[row.id] ?? 0}
                      {row.capacity ? ` / ${row.capacity}` : ""}
                    </button>
                  </td>
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
      {viewCourse ? (
        <ParticipantsModal
          course={viewCourse}
          registrations={regs.filter((r) => r.course_id === viewCourse.id)}
          onClose={() => setViewCourse(null)}
        />
      ) : null}
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
  const [courseFilter, setCourseFilter] = useState("all");
  useEffect(() => {
    fetchRegistrations().then(setRows);
  }, []);

  const courseOptions = useMemo(
    () => Array.from(new Set((rows ?? []).map((r) => r.course_title).filter(Boolean))) as string[],
    [rows]
  );
  const filtered = useMemo(
    () => (rows ?? []).filter((r) => courseFilter === "all" || r.course_title === courseFilter),
    [rows, courseFilter]
  );

  return (
    <>
      <div className="inbox-toolbar">
        <label className="inbox-filter">
          {t(tx("تصفية بالدورة", "Filter by course"))}
          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="all">{t(tx("كل الدورات", "All courses"))}</option>
            {courseOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <div className="inbox-toolbar-end">
          <span className="muted">
            {filtered.length} {t(tx("مشارك", "registered"))}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={filtered.length === 0}
            onClick={() =>
              exportRowsToExcel(
                courseFilter === "all" ? "training-registrations" : `registrations-${courseFilter}`,
                registrationExportRows(filtered)
              )
            }
          >
            <Download size={16} />
            {t(tx("تصدير Excel", "Export Excel"))}
          </button>
        </div>
      </div>

      <div className="admin-panel admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t(tx("الاسم", "Name"))}</th>
              <th>{t(tx("الجوال", "Phone"))}</th>
              <th>{t(tx("البريد", "Email"))}</th>
              <th>{t(tx("الهوية", "National ID"))}</th>
              <th>{t(tx("الجهة", "Job / Org"))}</th>
              <th>{t(tx("الدورة", "Course"))}</th>
              <th>{t(tx("التاريخ", "Submitted"))}</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <TableLoadingRows cols={7} />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="muted">{t(tx("لا توجد تسجيلات بعد.", "No registrations yet."))}</td></tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <td>{row.full_name}</td>
                  <td className="mono">{row.phone}</td>
                  <td>{row.email || "—"}</td>
                  <td className="mono">{row.national_id || "—"}</td>
                  <td>{row.job_title || "—"}</td>
                  <td>{row.course_title || "—"}</td>
                  <td className="mono">{row.created_at.slice(0, 10)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Hosting requests inbox (status update)                                      */
/* -------------------------------------------------------------------------- */

function RequestsInbox({
  notify,
  onConverted
}: {
  notify: (m: string, tone?: "success" | "error" | "info") => void;
  onConverted: (courseId: string) => void;
}) {
  const { t } = usePortal();
  const [rows, setRows] = useState<TrainingHostRequest[] | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const load = () => fetchHostRequests().then(setRows);
  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await updateHostRequestStatus(id, status);
    if (error) return notify(error, "error");
    setRows((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, status } : r)) : prev));
  };

  /* Approve = promote to a draft course and jump there to finish it off. */
  const approveToCourse = async (row: TrainingHostRequest) => {
    setConvertingId(row.id);
    const { id, error } = await convertHostRequestToCourse(row);
    setConvertingId(null);
    if (error && !id) return notify(error, "error");
    logAdminAction("training.request.approve", "training_host_requests", row.id);
    setRows((prev) => (prev ? prev.map((r) => (r.id === row.id ? { ...r, status: "approved" } : r)) : prev));
    notify(t(tx("تم الاعتماد ونقل الطلب إلى الدورات لإكمال بياناته.", "Approved — moved into Courses to complete its details.")), "success");
    if (id) onConverted(id);
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
            <th>{t(tx("إجراء", "Action"))}</th>
          </tr>
        </thead>
        <tbody>
          {rows === null ? (
            <TableLoadingRows cols={6} />
          ) : rows.length === 0 ? (
            <tr><td colSpan={6} className="muted">{t(tx("لا توجد طلبات بعد.", "No requests yet."))}</td></tr>
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
                <td>
                  {row.status === "approved" ? (
                    <span className="badge badge-success">{t(tx("نُقل إلى الدورات", "In Courses"))}</span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ minHeight: 34, padding: "0 12px" }}
                      disabled={convertingId === row.id}
                      onClick={() => approveToCourse(row)}
                    >
                      <ArrowRightCircle size={16} />
                      {convertingId === row.id ? t(tx("جارٍ…", "Working…")) : t(tx("اعتماد ← دورة", "Approve → Course"))}
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
