import { useEffect, useMemo, useState } from "react";
import { Download, Pencil, Stethoscope, Trash2 } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { Modal } from "../../components/ui/Modal";
import { exportRowsToExcel } from "../../lib/exports";
import { logAdminAction } from "../../lib/audit";
import { tx } from "../../utils/i18n";
import {
  adminDeleteAppointment,
  adminDeleteClinic,
  adminFetchAppointments,
  adminFetchClinics,
  adminUpdateAppointment,
  adminUpsertClinic,
  APPOINTMENT_STATUSES,
  shortTime,
  type AppointmentAdmin,
  type AppointmentClinic,
  type AppointmentStatus
} from "../../lib/supabase/appointments";
import { CrudFormActions, Field, TableLoadingRows, useDeleteConfirm } from "./shared";

type Notify = (m: string, tone?: "success" | "error" | "info") => void;

const STATUS_TEXT: Record<AppointmentStatus, ReturnType<typeof tx>> = {
  pending: tx("قيد المراجعة", "Under review"),
  approved: tx("مؤكد", "Confirmed"),
  rescheduled: tx("أُعيد جدولته", "Rescheduled"),
  completed: tx("مكتمل", "Completed"),
  cancelled: tx("ملغي", "Cancelled"),
  no_show: tx("لم يحضر", "No show")
};
const STATUS_TONE: Record<AppointmentStatus, string> = {
  pending: "warning",
  approved: "success",
  rescheduled: "info",
  completed: "success",
  cancelled: "danger",
  no_show: "danger"
};

const WEEKDAYS = [
  tx("الأحد", "Sun"),
  tx("الاثنين", "Mon"),
  tx("الثلاثاء", "Tue"),
  tx("الأربعاء", "Wed"),
  tx("الخميس", "Thu"),
  tx("الجمعة", "Fri"),
  tx("السبت", "Sat")
];

export function AdminRegistrations() {
  const { t, notify } = usePortal();
  const [tab, setTab] = useState<"requests" | "clinics">("requests");
  return (
    <div className="admin-page">
      <SectionHeading
        title={tx("التسجيل والمواعيد", "Registration & Appointments")}
        description={tx(
          "راجع طلبات مواعيد العيادات، حدّث حالتها وأضف ملاحظات للمراجع، وصدّر البيانات للنظام الداخلي.",
          "Review clinic appointment requests, update their status, add notes for the patient, and export data for the hospital system."
        )}
      />
      <div className="tab-row" role="tablist">
        <button type="button" className={tab === "requests" ? "is-active" : ""} onClick={() => setTab("requests")}>
          {t(tx("طلبات المواعيد", "Appointment requests"))}
        </button>
        <button type="button" className={tab === "clinics" ? "is-active" : ""} onClick={() => setTab("clinics")}>
          {t(tx("العيادات وأوقاتها", "Clinics & schedules"))}
        </button>
      </div>
      {tab === "requests" ? <RequestsPanel notify={notify} /> : <ClinicsPanel notify={notify} />}
    </div>
  );
}

/* ---- Appointment requests ----------------------------------------------- */
function RequestsPanel({ notify }: { notify: Notify }) {
  const { t, locale } = usePortal();
  const [rows, setRows] = useState<AppointmentAdmin[] | null>(null);
  const [clinics, setClinics] = useState<AppointmentClinic[]>([]);
  const [clinicId, setClinicId] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<AppointmentAdmin | null>(null);

  const load = () => {
    setRows(null);
    adminFetchAppointments({ clinicId: clinicId || undefined, status: status || undefined, from: from || undefined, to: to || undefined }).then(setRows);
  };
  useEffect(() => {
    adminFetchClinics().then(setClinics);
  }, []);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId, status, from, to]);

  const { dialog, requestDelete } = useDeleteConfirm(async (id) => {
    const { error } = await adminDeleteAppointment(id);
    if (error) return notify(error, "error");
    notify(t(tx("تم الحذف.", "Deleted.")), "success");
    load();
  });

  /* Free-text search runs client-side over the already-filtered set. */
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows ?? [];
    return (rows ?? []).filter((r) =>
      [r.reference, r.full_name, r.national_id, r.phone].some((v) => (v || "").toLowerCase().includes(needle))
    );
  }, [rows, q]);

  const exportRows = () => {
    if (filtered.length === 0) return;
    exportRowsToExcel(
      `appointments-${clinicId ? "clinic" : "all"}-${new Date().toISOString().slice(0, 10)}`,
      filtered.map((r) => ({
        Reference: r.reference,
        Clinic: t(tx(r.clinic_name_ar || "", r.clinic_name_en || "")),
        Date: r.appointment_date,
        Time: shortTime(r.appointment_time),
        "Patient name": r.full_name,
        "National ID": r.national_id,
        Nationality: r.nationality ?? "",
        Phone: r.phone,
        "Date of birth": r.dob ?? "",
        Calendar: r.dob_calendar,
        Status: r.status,
        "Patient notes": r.notes ?? "",
        "Note to patient": r.admin_note ?? "",
        "Internal note": r.internal_note ?? "",
        Submitted: r.created_at?.slice(0, 16).replace("T", " ") ?? ""
      }))
    );
    logAdminAction("appointments.export", "appointments", null);
  };

  const quickStatus = async (row: AppointmentAdmin, next: string) => {
    const { error } = await adminUpdateAppointment(row.id, { status: next as AppointmentStatus });
    if (error) return notify(error, "error");
    load();
  };

  const dateLabel = (iso: string) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", { dateStyle: "medium" }).format(
      new Date(`${iso}T00:00:00`)
    );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (rows ?? []).forEach((r) => (c[r.status] = (c[r.status] ?? 0) + 1));
    return c;
  }, [rows]);

  return (
    <>
      <div className="reg-stats">
        {(["pending", "approved", "completed", "cancelled"] as AppointmentStatus[]).map((s) => (
          <div key={s}>
            <strong>{counts[s] ?? 0}</strong>
            <span>{t(STATUS_TEXT[s])}</span>
          </div>
        ))}
      </div>

      <div className="inbox-toolbar reg-filters">
        <label className="inbox-filter">
          {t(tx("العيادة", "Clinic"))}
          <select value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
            <option value="">{t(tx("كل العيادات", "All clinics"))}</option>
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {t(tx(c.name_ar, c.name_en))}
              </option>
            ))}
          </select>
        </label>
        <label className="inbox-filter">
          {t(tx("الحالة", "Status"))}
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t(tx("الكل", "All"))}</option>
            {APPOINTMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(STATUS_TEXT[s])}
              </option>
            ))}
          </select>
        </label>
        <label className="inbox-filter">
          {t(tx("من تاريخ", "From"))}
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="inbox-filter">
          {t(tx("إلى تاريخ", "To"))}
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="inbox-filter">
          {t(tx("بحث", "Search"))}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t(tx("رقم الطلب / الاسم / الهوية / الجوال", "reference / name / ID / phone"))}
            dir="auto"
          />
        </label>
        <div className="inbox-toolbar-end">
          <span className="muted">
            {filtered.length} {t(tx("طلب", "requests"))}
          </span>
          <button type="button" className="btn btn-secondary" disabled={filtered.length === 0} onClick={exportRows}>
            <Download size={16} />
            {t(tx("تصدير Excel", "Export Excel"))}
          </button>
        </div>
      </div>

      <div className="admin-panel admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t(tx("رقم الطلب", "Reference"))}</th>
              <th>{t(tx("المريض", "Patient"))}</th>
              <th>{t(tx("العيادة", "Clinic"))}</th>
              <th>{t(tx("الموعد", "Appointment"))}</th>
              <th>{t(tx("الجوال", "Phone"))}</th>
              <th>{t(tx("الحالة", "Status"))}</th>
              <th>{t(tx("إجراءات", "Actions"))}</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <TableLoadingRows cols={7} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">
                  {t(tx("لا توجد طلبات مطابقة.", "No matching requests."))}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.reference}</td>
                  <td>
                    {r.full_name}
                    <br />
                    <small className="muted mono">{r.national_id}</small>
                  </td>
                  <td>{t(tx(r.clinic_name_ar || "", r.clinic_name_en || ""))}</td>
                  <td className="mono">
                    {dateLabel(r.appointment_date)}
                    <br />
                    <small>{shortTime(r.appointment_time)}</small>
                  </td>
                  <td className="mono">{r.phone}</td>
                  <td>
                    <select
                      className={`reg-status reg-status-${STATUS_TONE[r.status]}`}
                      value={r.status}
                      onChange={(e) => quickStatus(r, e.target.value)}
                    >
                      {APPOINTMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {t(STATUS_TEXT[s])}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className="icon-button" onClick={() => setEditing(r)} aria-label={t(tx("تفاصيل", "Details"))}>
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => requestDelete(r.id, r.reference)}
                      aria-label={t(tx("حذف", "Delete"))}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing ? (
        <RequestDetail
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          notify={notify}
        />
      ) : null}
      {dialog}
    </>
  );
}

/* Full record + notes, the view the registration desk transcribes from. */
function RequestDetail({
  row,
  onClose,
  onSaved,
  notify
}: {
  row: AppointmentAdmin;
  onClose: () => void;
  onSaved: () => void;
  notify: Notify;
}) {
  const { t } = usePortal();
  const [form, setForm] = useState({
    status: row.status,
    admin_note: row.admin_note ?? "",
    internal_note: row.internal_note ?? "",
    appointment_date: row.appointment_date,
    appointment_time: shortTime(row.appointment_time)
  });
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await adminUpdateAppointment(row.id, {
      status: form.status,
      admin_note: form.admin_note || null,
      internal_note: form.internal_note || null,
      appointment_date: form.appointment_date,
      appointment_time: form.appointment_time
    });
    setBusy(false);
    if (error) return notify(error, "error");
    logAdminAction("appointments.update", "appointments", row.id);
    notify(t(tx("تم الحفظ.", "Saved.")), "success");
    onSaved();
  };

  const line = (label: ReturnType<typeof tx>, value: string) => (
    <div className="reg-detail-line">
      <span>{t(label)}</span>
      <strong>{value || "—"}</strong>
    </div>
  );

  return (
    <Modal title={`${t(tx("طلب موعد", "Appointment request"))} · ${row.reference}`} onClose={onClose} wide>
      <div className="reg-detail">
        <div className="reg-detail-grid">
          {line(tx("الاسم الكامل", "Full name"), row.full_name)}
          {line(tx("رقم الهوية / الإقامة", "National ID / Iqama"), row.national_id)}
          {line(tx("الجنسية", "Nationality"), row.nationality ?? "")}
          {line(tx("رقم الجوال", "Phone"), row.phone)}
          {line(
            tx("تاريخ الميلاد", "Date of birth"),
            row.dob ? `${row.dob} (${row.dob_calendar === "hijri" ? t(tx("هجري", "Hijri")) : t(tx("ميلادي", "Gregorian"))})` : ""
          )}
          {line(tx("العيادة", "Clinic"), t(tx(row.clinic_name_ar || "", row.clinic_name_en || "")))}
          {line(tx("تاريخ الإرسال", "Submitted"), row.created_at?.slice(0, 16).replace("T", " ") ?? "")}
          {line(tx("ملاحظات المريض", "Patient notes"), row.notes ?? "")}
        </div>

        <form onSubmit={save} className="reg-detail-form">
          <Field label={tx("الحالة", "Status")}>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentStatus })}>
              {APPOINTMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(STATUS_TEXT[s])}
                </option>
              ))}
            </select>
          </Field>
          <Field label={tx("تاريخ الموعد", "Appointment date")}>
            <input type="date" value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} />
          </Field>
          <Field label={tx("وقت الموعد", "Appointment time")}>
            <input type="time" value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} />
          </Field>
          <Field label={tx("ملاحظة تظهر للمراجع", "Note shown to the patient")} wide>
            <textarea value={form.admin_note} onChange={(e) => setForm({ ...form, admin_note: e.target.value })} rows={2} dir="auto" />
          </Field>
          <Field label={tx("ملاحظة داخلية (لا تظهر للمراجع)", "Internal note (never shown to the patient)")} wide>
            <textarea value={form.internal_note} onChange={(e) => setForm({ ...form, internal_note: e.target.value })} rows={2} dir="auto" />
          </Field>
          <div className="field-wide" style={{ display: "flex", gap: 10 }}>
            <CrudFormActions busy={busy} editing onCancel={onClose} />
          </div>
        </form>
      </div>
    </Modal>
  );
}

/* ---- Clinics + schedules ------------------------------------------------ */
const EMPTY_CLINIC: Partial<AppointmentClinic> = {
  name_ar: "",
  name_en: "",
  work_days: [0, 1, 2, 3, 4],
  slot_start: "08:00",
  slot_end: "14:00",
  slot_minutes: 20,
  slot_capacity: 1,
  lead_days: 1,
  horizon_days: 30,
  is_active: true,
  sort_order: 100
};

function ClinicsPanel({ notify }: { notify: Notify }) {
  const { t } = usePortal();
  const [rows, setRows] = useState<AppointmentClinic[] | null>(null);
  const [form, setForm] = useState<Partial<AppointmentClinic>>(EMPTY_CLINIC);
  const [busy, setBusy] = useState(false);
  const editing = Boolean(form.id);

  const load = () => adminFetchClinics().then(setRows);
  useEffect(() => {
    load();
  }, []);

  const { dialog, requestDelete } = useDeleteConfirm(async (id) => {
    const { error } = await adminDeleteClinic(id);
    if (error) return notify(error, "error");
    notify(t(tx("تم الحذف.", "Deleted.")), "success");
    load();
  });

  const toggleDay = (d: number) => {
    const days = new Set(form.work_days ?? []);
    if (days.has(d)) days.delete(d);
    else days.add(d);
    setForm({ ...form, work_days: Array.from(days).sort() });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name_ar?.trim() || !form.name_en?.trim()) {
      return notify(t(tx("اسم العيادة بالعربية والإنجليزية مطلوب.", "Arabic and English clinic names are required.")), "error");
    }
    setBusy(true);
    const { error } = await adminUpsertClinic(form);
    setBusy(false);
    if (error) return notify(error, "error");
    logAdminAction(editing ? "appointment_clinic.update" : "appointment_clinic.create", "appointment_clinics", form.id ?? null);
    notify(t(tx("تم الحفظ.", "Saved.")), "success");
    setForm(EMPTY_CLINIC);
    load();
  };

  return (
    <>
      <div className="admin-panel admin-form" style={{ marginBottom: 20 }}>
        <h2 className="field-wide">{editing ? t(tx("تعديل عيادة", "Edit clinic")) : t(tx("إضافة عيادة", "Add clinic"))}</h2>
        <form onSubmit={save} style={{ display: "contents" }}>
          <Field label={tx("اسم العيادة (عربي)", "Clinic name (AR)")}>
            <input value={form.name_ar ?? ""} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} dir="auto" />
          </Field>
          <Field label={tx("اسم العيادة (إنجليزي)", "Clinic name (EN)")}>
            <input value={form.name_en ?? ""} onChange={(e) => setForm({ ...form, name_en: e.target.value })} dir="auto" />
          </Field>
          <Field label={tx("من الساعة", "Start time")}>
            <input type="time" value={(form.slot_start ?? "").slice(0, 5)} onChange={(e) => setForm({ ...form, slot_start: e.target.value })} />
          </Field>
          <Field label={tx("إلى الساعة", "End time")}>
            <input type="time" value={(form.slot_end ?? "").slice(0, 5)} onChange={(e) => setForm({ ...form, slot_end: e.target.value })} />
          </Field>
          <Field label={tx("مدة الموعد (دقيقة)", "Slot length (min)")}>
            <input type="number" value={form.slot_minutes ?? 20} onChange={(e) => setForm({ ...form, slot_minutes: Number(e.target.value) })} />
          </Field>
          <Field label={tx("عدد المرضى لكل موعد", "Patients per slot")}>
            <input type="number" value={form.slot_capacity ?? 1} onChange={(e) => setForm({ ...form, slot_capacity: Number(e.target.value) })} />
          </Field>
          <Field label={tx("أقرب حجز بعد (أيام)", "Earliest booking (days)")}>
            <input type="number" value={form.lead_days ?? 1} onChange={(e) => setForm({ ...form, lead_days: Number(e.target.value) })} />
          </Field>
          <Field label={tx("أقصى حجز خلال (أيام)", "Booking horizon (days)")}>
            <input type="number" value={form.horizon_days ?? 30} onChange={(e) => setForm({ ...form, horizon_days: Number(e.target.value) })} />
          </Field>

          <div className="field-wide">
            <span className="reg-days-label">{t(tx("أيام العمل", "Working days"))}</span>
            <div className="reg-days">
              {WEEKDAYS.map((d, i) => (
                <button
                  type="button"
                  key={i}
                  className={`chip ${(form.work_days ?? []).includes(i) ? "is-active" : ""}`}
                  onClick={() => toggleDay(i)}
                >
                  {t(d)}
                </button>
              ))}
            </div>
          </div>

          <Field label={tx("تعليمات الحضور (عربي)", "Attendance instructions (AR)")} wide>
            <textarea value={form.instructions_ar ?? ""} onChange={(e) => setForm({ ...form, instructions_ar: e.target.value })} rows={2} dir="auto" />
          </Field>
          <Field label={tx("تعليمات الحضور (إنجليزي)", "Attendance instructions (EN)")} wide>
            <textarea value={form.instructions_en ?? ""} onChange={(e) => setForm({ ...form, instructions_en: e.target.value })} rows={2} dir="auto" />
          </Field>
          <Field label={tx("الموقع داخل المستشفى (عربي)", "Location in hospital (AR)")}>
            <input value={form.location_ar ?? ""} onChange={(e) => setForm({ ...form, location_ar: e.target.value })} dir="auto" />
          </Field>
          <Field label={tx("الموقع داخل المستشفى (إنجليزي)", "Location in hospital (EN)")}>
            <input value={form.location_en ?? ""} onChange={(e) => setForm({ ...form, location_en: e.target.value })} dir="auto" />
          </Field>

          <label className="field-wide" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
            <input
              type="checkbox"
              checked={form.is_active ?? true}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              style={{ width: 18, height: 18 }}
            />
            {t(tx("متاحة للحجز", "Open for booking"))}
          </label>

          <div className="field-wide" style={{ display: "flex", gap: 10 }}>
            <CrudFormActions busy={busy} editing={editing} onCancel={() => setForm(EMPTY_CLINIC)} />
          </div>
        </form>
      </div>

      <div className="admin-panel admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t(tx("العيادة", "Clinic"))}</th>
              <th>{t(tx("الأيام", "Days"))}</th>
              <th>{t(tx("الدوام", "Hours"))}</th>
              <th>{t(tx("المدة", "Slot"))}</th>
              <th>{t(tx("الحالة", "Status"))}</th>
              <th>{t(tx("إجراءات", "Actions"))}</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <TableLoadingRows cols={6} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  {t(tx("لا توجد عيادات.", "No clinics."))}
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Stethoscope size={15} style={{ verticalAlign: "-2px", marginInlineEnd: 6, color: "var(--primary)" }} />
                    {t(tx(c.name_ar, c.name_en))}
                  </td>
                  <td>{(c.work_days ?? []).map((d) => t(WEEKDAYS[d])).join("، ")}</td>
                  <td className="mono">
                    {shortTime(c.slot_start)}–{shortTime(c.slot_end)}
                  </td>
                  <td className="mono">
                    {c.slot_minutes}
                    {t(tx("د", "m"))} × {c.slot_capacity}
                  </td>
                  <td>
                    <span className={`badge ${c.is_active ? "badge-success" : "badge-muted"}`}>
                      {c.is_active ? t(tx("متاحة", "Open")) : t(tx("موقوفة", "Closed"))}
                    </span>
                  </td>
                  <td>
                    <button className="icon-button" onClick={() => setForm(c)} aria-label={t(tx("تعديل", "Edit"))}>
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => requestDelete(c.id, t(tx(c.name_ar, c.name_en)))}
                      aria-label={t(tx("حذف", "Delete"))}
                    >
                      <Trash2 size={16} />
                    </button>
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
