import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Award, Download, FileText, QrCode, Save, UploadCloud } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { supabase } from "../../lib/supabase/client";
import { exportRowsToExcel } from "../../lib/exports";
import { logAdminAction } from "../../lib/audit";
import { tx } from "../../utils/i18n";
import { fetchAllCourses, type TrainingCourse } from "../../lib/supabase/training";
import {
  adminFetchAttendance,
  adminUpdateConfig,
  certField,
  DEFAULT_CERT_FIELDS,
  fetchTrainingConfig,
  type AttendanceRecord,
  type CertField,
  type CertFieldKey,
  type TrainingConfig
} from "../../lib/supabase/attendance";
import { Field, TableLoadingRows } from "./shared";
import { ImageField } from "./ImageField";
import { CertificateView } from "../training/CertificateView";

type Notify = (m: string, tone?: "success" | "error" | "info") => void;
const FIELD_KEYS: CertFieldKey[] = ["name", "employee_number", "course", "duration", "date"];
const FIELD_LABELS: Record<CertFieldKey, ReturnType<typeof tx>> = {
  name: tx("الاسم", "Name"),
  employee_number: tx("الرقم الوظيفي", "Employee number"),
  course: tx("اسم الدورة", "Course name"),
  duration: tx("المدة", "Duration"),
  date: tx("التاريخ", "Date")
};
const SAMPLE: Record<CertFieldKey, ReturnType<typeof tx>> = {
  name: tx("سلطان عوده الجهني", "Sultan A. Aljohani"),
  employee_number: tx("الرقم الوظيفي: 4506212", "Employee No: 4506212"),
  course: tx("دورة الكود الأزرق", "Code Blue Course"),
  duration: tx("المدة: ساعة واحدة", "Duration: 1 hour"),
  date: tx("20 يوليو 2026", "20 July 2026")
};

export function AdminAttendance({ notify }: { notify: Notify }) {
  const { t } = usePortal();
  const [sub, setSub] = useState<"config" | "qr" | "records">("config");
  return (
    <div className="attend-admin">
      <div className="tab-row tab-row-sub" role="tablist">
        <button type="button" className={sub === "config" ? "is-active" : ""} onClick={() => setSub("config")}>
          {t(tx("الإعدادات والشهادة", "Settings & certificate"))}
        </button>
        <button type="button" className={sub === "qr" ? "is-active" : ""} onClick={() => setSub("qr")}>
          {t(tx("رمز QR", "QR code"))}
        </button>
        <button type="button" className={sub === "records" ? "is-active" : ""} onClick={() => setSub("records")}>
          {t(tx("سجل الحضور", "Attendance"))}
        </button>
      </div>
      {sub === "config" ? <ConfigPanel notify={notify} /> : null}
      {sub === "qr" ? <QrPanel /> : null}
      {sub === "records" ? <RecordsPanel /> : null}
    </div>
  );
}

/* ---- Config + certificate designer -------------------------------------- */
function ConfigPanel({ notify }: { notify: Notify }) {
  const { t } = usePortal();
  const [cfg, setCfg] = useState<TrainingConfig | null>(null);
  const [fields, setFields] = useState<Record<CertFieldKey, CertField>>(DEFAULT_CERT_FIELDS);
  const [busy, setBusy] = useState(false);
  const [wordBusy, setWordBusy] = useState(false);

  useEffect(() => {
    fetchTrainingConfig().then((c) => {
      setCfg(c);
      const merged = { ...DEFAULT_CERT_FIELDS };
      (Object.keys(DEFAULT_CERT_FIELDS) as CertFieldKey[]).forEach((k) => {
        merged[k] = certField(c, k);
      });
      setFields(merged);
    });
  }, []);

  const patch = (p: Partial<TrainingConfig>) => setCfg((c) => (c ? { ...c, ...p } : c));
  const setField = (k: CertFieldKey, p: Partial<CertField>) => setFields((f) => ({ ...f, [k]: { ...f[k], ...p } }));

  const uploadWord = async (file: File) => {
    if (!supabase) return notify(t(tx("Supabase غير متصل.", "Supabase not connected.")), "error");
    setWordBusy(true);
    const safe = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `training/${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from("public-assets").upload(path, file);
    if (error) {
      setWordBusy(false);
      return notify(error.message, "error");
    }
    const { data } = supabase.storage.from("public-assets").getPublicUrl(path);
    setWordBusy(false);
    patch({ cert_word_url: data.publicUrl });
    notify(t(tx("تم رفع القالب.", "Template uploaded.")), "success");
  };

  const save = async () => {
    if (!cfg) return;
    setBusy(true);
    const { error } = await adminUpdateConfig({
      open_before_min: cfg.open_before_min,
      hide_after_hours: cfg.hide_after_hours,
      cert_bg_url: cfg.cert_bg_url,
      cert_word_url: cfg.cert_word_url,
      cert_fields: fields
    });
    setBusy(false);
    if (error) return notify(error, "error");
    logAdminAction("training.config.update", "training_config", null);
    notify(t(tx("تم الحفظ.", "Saved.")), "success");
  };

  if (!cfg) return <div className="admin-panel muted">{t(tx("جارٍ التحميل…", "Loading…"))}</div>;

  return (
    <>
      <div className="admin-panel admin-form" style={{ marginBottom: 20 }}>
        <h2 className="field-wide">{t(tx("توقيت التسجيل", "Attendance timing"))}</h2>
        <Field label={tx("فتح التسجيل قبل البداية (دقائق)", "Open check-in before start (min)")}>
          <input type="number" value={cfg.open_before_min} onChange={(e) => patch({ open_before_min: Number(e.target.value) })} />
        </Field>
        <Field label={tx("إخفاء الدورة بعد الانتهاء (ساعات)", "Hide course after end (hours)")}>
          <input type="number" value={cfg.hide_after_hours} onChange={(e) => patch({ hide_after_hours: Number(e.target.value) })} />
        </Field>
      </div>

      <div className="admin-panel admin-form" style={{ marginBottom: 20 }}>
        <h2 className="field-wide">{t(tx("تصميم الشهادة", "Certificate design"))}</h2>
        <p className="field-wide muted" style={{ margin: "-6px 0 4px" }}>
          {t(tx(
            "ارفع خلفية الشهادة كصورة (صدّرها من ملف Word/PDF)، وحدّد مواضع الحقول. يمكنك أيضًا حفظ ملف Word للرجوع إليه.",
            "Upload the certificate background as an image (export it from your Word/PDF), then position the fields. You can also store the Word file for reference."
          ))}
        </p>
        <div className="field-wide">
          <ImageField label={tx("خلفية الشهادة", "Certificate background")} value={cfg.cert_bg_url ?? ""} onChange={(url) => patch({ cert_bg_url: url })} aspect={297 / 210} />
        </div>
        <div className="field-wide attend-word-row">
          <label className="btn btn-secondary">
            {wordBusy ? <UploadCloud size={16} /> : <FileText size={16} />}
            {t(tx("رفع قالب Word (اختياري)", "Upload Word template (optional)"))}
            <input type="file" accept=".doc,.docx" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadWord(f); e.target.value = ""; }} />
          </label>
          {cfg.cert_word_url ? (
            <a href={cfg.cert_word_url} target="_blank" rel="noreferrer" className="btn btn-ghost">
              <Download size={16} />
              {t(tx("تنزيل القالب الحالي", "Download current template"))}
            </a>
          ) : null}
        </div>
      </div>

      <div className="admin-panel" style={{ marginBottom: 20 }}>
        <h2>{t(tx("مواضع الحقول", "Field positions"))}</h2>
        <div className="cert-preview-wrap">
          <div className={`cert-sheet ${cfg.cert_bg_url ? "" : "cert-sheet-fallback"}`}>
            {cfg.cert_bg_url ? <img className="cert-bg" src={cfg.cert_bg_url} alt="" /> : null}
            {FIELD_KEYS.map((k) => {
              const f = fields[k];
              if (!f.enabled) return null;
              return (
                <span key={k} className="cert-field" style={{ left: `${f.x}%`, top: `${f.y}%`, transform: "translate(-50%,-50%)", fontSize: `${(f.size / 1000) * 100}cqw`, color: f.color, fontWeight: f.weight, textAlign: f.align, width: "90%" }}>
                  {t(SAMPLE[k])}
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
                        <option value="start">{t(tx("يمين/يسار", "Start"))}</option><option value="center">{t(tx("وسط", "Center"))}</option><option value="end">{t(tx("نهاية", "End"))}</option>
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

      <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>
        <Save size={16} />
        {t(tx("حفظ الإعدادات", "Save settings"))}
      </button>
    </>
  );
}

/* ---- QR ----------------------------------------------------------------- */
function QrPanel() {
  const { t } = usePortal();
  const url = `${window.location.origin}/attend`;
  const [dataUrl, setDataUrl] = useState("");
  useEffect(() => {
    QRCode.toDataURL(url, { width: 640, margin: 1, color: { dark: "#0e2841", light: "#ffffff" } }).then(setDataUrl);
  }, [url]);
  return (
    <div className="admin-panel attend-qr">
      <QrCode size={20} />
      <h2>{t(tx("رمز حضور الدورات", "Course attendance QR"))}</h2>
      <p className="muted">{t(tx("رمز واحد ثابت — اطبعه وضعه عند قاعة الدورات. يفتح الدورة النشطة تلقائيًا.", "One fixed code — print it and place it at the training hall. It opens the active course automatically."))}</p>
      {dataUrl ? <img src={dataUrl} alt="QR" className="attend-qr-img" /> : null}
      <code className="attend-qr-url">{url}</code>
      {dataUrl ? (
        <a href={dataUrl} download="attendance-qr.png" className="btn btn-primary">
          <Download size={16} />
          {t(tx("تنزيل الرمز (PNG)", "Download QR (PNG)"))}
        </a>
      ) : null}
    </div>
  );
}

/* ---- Attendance records ------------------------------------------------- */
function RecordsPanel() {
  const { t } = usePortal();
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [courseId, setCourseId] = useState<string>("");
  const [rows, setRows] = useState<AttendanceRecord[] | null>(null);
  const [cfg, setCfg] = useState<TrainingConfig | null>(null);
  const [cert, setCert] = useState<Record<CertFieldKey, string> | null>(null);

  useEffect(() => {
    fetchAllCourses().then(setCourses);
    fetchTrainingConfig().then(setCfg);
  }, []);
  useEffect(() => {
    setRows(null);
    adminFetchAttendance(courseId || undefined).then(setRows);
  }, [courseId]);

  const course = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId]);
  const durationText = useMemo(() => {
    if (!course?.starts_at || !course?.ends_at) return "";
    const m = Math.round((new Date(course.ends_at).getTime() - new Date(course.starts_at).getTime()) / 60000);
    return m > 0 ? `${Math.floor(m / 60)}h ${m % 60}m` : "";
  }, [course]);

  const exportRows = () => {
    if (!rows || rows.length === 0) return;
    exportRowsToExcel(`attendance-${course ? course.title_en : "all"}`, rows.map((r) => ({
      Name: r.full_name,
      "Employee No": r.employee_number ?? "",
      "National ID": r.national_id ?? "",
      "Checked in": r.checked_in_at.slice(0, 16).replace("T", " "),
      "Certificate printed": r.certificate_printed_at ? r.certificate_printed_at.slice(0, 16).replace("T", " ") : "",
      Overall: r.feedback_overall ?? "",
      Content: r.feedback_content ?? "",
      Recommend: r.feedback_recommend === null ? "" : r.feedback_recommend ? "Yes" : "No",
      Benefit: r.feedback_benefit ?? "",
      Comment: r.feedback_comment ?? ""
    })));
  };

  const makeCert = (r: AttendanceRecord) => {
    if (!cfg) return;
    const c = courses.find((x) => x.id === r.course_id);
    setCert({
      name: r.full_name,
      employee_number: r.employee_number ?? "",
      course: c ? t(tx(c.title_ar, c.title_en)) : "",
      duration: durationText,
      date: new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date())
    });
  };

  return (
    <>
      <div className="inbox-toolbar">
        <label className="inbox-filter">{t(tx("الدورة", "Course"))}
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">{t(tx("كل الدورات", "All courses"))}</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{t(tx(c.title_ar, c.title_en))}</option>)}
          </select>
        </label>
        <div className="inbox-toolbar-end">
          <span className="muted">{rows?.length ?? 0} {t(tx("حضور", "attended"))}</span>
          <button type="button" className="btn btn-secondary" disabled={!rows || rows.length === 0} onClick={exportRows}>
            <Download size={16} />{t(tx("تصدير Excel", "Export Excel"))}
          </button>
        </div>
      </div>

      <div className="admin-panel admin-table-wrap">
        <table className="admin-table">
          <thead><tr>
            <th>{t(tx("الاسم", "Name"))}</th><th>{t(tx("الرقم الوظيفي", "Emp. No"))}</th><th>{t(tx("الحضور", "Checked in"))}</th>
            <th>{t(tx("التقييم", "Rating"))}</th><th>{t(tx("الشهادة", "Certificate"))}</th>
          </tr></thead>
          <tbody>
            {rows === null ? <TableLoadingRows cols={5} /> : rows.length === 0 ? (
              <tr><td colSpan={5} className="muted">{t(tx("لا يوجد حضور.", "No attendance yet."))}</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}>
                <td>{r.full_name}</td>
                <td className="mono">{r.employee_number || "—"}</td>
                <td className="mono">{r.checked_in_at.slice(0, 16).replace("T", " ")}</td>
                <td>{r.feedback_overall ? `★ ${r.feedback_overall}/5` : "—"}</td>
                <td>
                  <button className="btn btn-ghost" style={{ minHeight: 32, padding: "0 10px" }} onClick={() => makeCert(r)}>
                    <Award size={15} />{t(tx("شهادة", "Certificate"))}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cert && cfg ? <CertificateView config={cfg} values={cert} onClose={() => setCert(null)} /> : null}
    </>
  );
}
