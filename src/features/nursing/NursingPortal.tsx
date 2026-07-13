import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  BookOpenText,
  CalendarPlus,
  FileText,
  GaugeCircle,
  LogOut,
  Plus,
  ShieldAlert
} from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SkeletonPage } from "../../components/ui/Skeleton";
import { usePageMeta } from "../../hooks/usePageMeta";
import {
  clearNursingToken,
  fetchPublishedPolicies,
  getNursingToken,
  nursingAddProfileItem,
  nursingManagerOverview,
  nursingMe,
  nursingSubmitVacation,
  type ManagerOverview,
  type NursingPolicy,
  type NursingStaffSelf,
  type ProfileItem,
  type VacationPlan
} from "../../lib/supabase/nursing";
import { tx } from "../../utils/i18n";

type Service = "overview" | "policies" | "vacation" | "profile" | "manager";

const KIND_LABEL: Record<string, ReturnType<typeof tx>> = {
  certificate: tx("شهادة", "Certificate"),
  license: tx("ترخيص", "License"),
  competency: tx("كفاءة", "Competency"),
  health_certificate: tx("الشهادة الصحية", "Health certificate"),
  bls: tx("BLS", "BLS"),
  acls: tx("ACLS", "ACLS"),
  other: tx("أخرى", "Other")
};

const STATUS_TONE: Record<string, string> = {
  approved: "badge-success",
  submitted: "badge-warning",
  pending: "badge-warning",
  returned: "badge-info",
  rejected: "badge-danger",
  cancelled: "badge-muted"
};

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("");
}

export function NursingPortal() {
  const { t, locale } = usePortal();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<NursingStaffSelf | null>(null);
  const [vacations, setVacations] = useState<VacationPlan[]>([]);
  const [profile, setProfile] = useState<ProfileItem[]>([]);
  const [service, setService] = useState<Service>("overview");
  const [loading, setLoading] = useState(true);

  usePageMeta(tx("بوابة كادر التمريض", "Nursing staff portal"));
  const token = getNursingToken();

  const refresh = useCallback(async () => {
    if (!token) {
      navigate("/nursing");
      return;
    }
    const res = await nursingMe(token);
    if (!res || res.status !== "ok" || !res.staff) {
      clearNursingToken();
      navigate("/nursing");
      return;
    }
    setStaff(res.staff);
    setVacations(res.vacations ?? []);
    setProfile(res.profile ?? []);
    setLoading(false);
  }, [token, navigate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = () => {
    clearNursingToken();
    navigate("/nursing");
  };

  if (loading || !staff) return <SkeletonPage />;

  const dateLocale = locale === "ar" ? "ar-SA" : "en-GB";

  return (
    <section className="section nursing-portal">
      <div className="container">
        {/* Luxury profile header */}
        <header className="portal-hero">
          <div className="portal-avatar" aria-hidden="true">{initials(staff.full_name)}</div>
          <div className="portal-hero-copy">
            <span className="eyebrow">{t(tx("بوابة كادر التمريض", "Nursing staff portal"))}</span>
            <h1>{staff.full_name}</h1>
            <div className="portal-meta">
              {staff.specialty ? <span>{staff.specialty}</span> : null}
              {staff.department ? <span>{staff.department}</span> : null}
              <span className="mono">#{staff.employee_number}</span>
              {staff.is_manager ? <span className="badge badge-info">{t(tx("مدير التمريض", "Nursing Manager"))}</span> : null}
            </div>
          </div>
          <button className="btn btn-secondary portal-signout" onClick={signOut}>
            <LogOut size={18} />
            {t(tx("خروج", "Sign out"))}
          </button>
        </header>

        {/* Service cards */}
        <div className="portal-services">
          <ServiceCard icon={BookOpenText} active={service === "policies"} onClick={() => setService("policies")}
            title={tx("سياسات التمريض", "Nursing policies")} desc={tx("اطّلع على السياسات المعتمدة", "Review approved policies")} />
          <ServiceCard icon={CalendarPlus} active={service === "vacation"} onClick={() => setService("vacation")}
            title={tx("خطة الإجازات", "Vacation plan")} desc={tx("قدّم خطة إجازتك السنوية", "Submit your annual leave plan")} />
          <ServiceCard icon={Award} active={service === "profile"} onClick={() => setService("profile")}
            title={tx("الملف المهني", "Nurse profile")} desc={tx("شهاداتك وتراخيصك وكفاءاتك", "Your certificates, licenses & competencies")} />
          {staff.is_manager ? (
            <ServiceCard icon={GaugeCircle} active={service === "manager"} onClick={() => setService("manager")}
              title={tx("لوحة المدير", "Manager dashboard")} desc={tx("الكادر والمؤشرات", "Staff & KPIs")} />
          ) : null}
        </div>

        <div className="portal-panel">
          {service === "overview" ? <OverviewPanel vacations={vacations} profile={profile} /> : null}
          {service === "policies" ? <PoliciesPanel /> : null}
          {service === "vacation" ? <VacationPanel token={token} vacations={vacations} onDone={refresh} dateLocale={dateLocale} /> : null}
          {service === "profile" ? <ProfilePanel token={token} profile={profile} onDone={refresh} /> : null}
          {service === "manager" ? <ManagerPanel token={token} /> : null}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ icon: Icon, title, desc, active, onClick }: {
  icon: typeof Award; title: ReturnType<typeof tx>; desc: ReturnType<typeof tx>; active: boolean; onClick: () => void;
}) {
  const { t } = usePortal();
  return (
    <button className={`portal-service-card info-card ${active ? "is-active" : ""}`} onClick={onClick}>
      <span className="service-icon"><Icon size={24} /></span>
      <strong>{t(title)}</strong>
      <span className="muted">{t(desc)}</span>
    </button>
  );
}

function OverviewPanel({ vacations, profile }: { vacations: VacationPlan[]; profile: ProfileItem[] }) {
  const { t } = usePortal();
  const soon = profile.filter((p) => p.status === "approved" && p.expiry_date && daysUntil(p.expiry_date) <= 60);
  return (
    <div className="portal-overview">
      <p className="muted">{t(tx("اختر خدمة من الأعلى للبدء.", "Choose a service above to get started."))}</p>
      {soon.length > 0 ? (
        <div className="portal-alert">
          <ShieldAlert size={18} />
          <span>
            {t(tx("لديك وثائق تنتهي قريبًا:", "You have documents expiring soon:"))}{" "}
            {soon.map((p) => p.title).join("، ")}
          </span>
        </div>
      ) : null}
      <div className="portal-mini-stats">
        <div><strong>{vacations.length}</strong><span>{t(tx("طلبات إجازة", "Vacation requests"))}</span></div>
        <div><strong>{profile.filter((p) => p.status === "approved").length}</strong><span>{t(tx("وثائق معتمدة", "Approved documents"))}</span></div>
        <div><strong>{profile.filter((p) => p.status === "pending").length}</strong><span>{t(tx("قيد المراجعة", "Pending review"))}</span></div>
      </div>
    </div>
  );
}

function PoliciesPanel() {
  const { t } = usePortal();
  const [policies, setPolicies] = useState<NursingPolicy[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    fetchPublishedPolicies().then(setPolicies);
  }, []);
  if (policies === null) return <p className="muted">{t(tx("جارٍ التحميل…", "Loading…"))}</p>;
  if (policies.length === 0) return <p className="muted">{t(tx("لا توجد سياسات منشورة بعد.", "No policies published yet."))}</p>;
  return (
    <div className="policy-list">
      {policies.map((p) => (
        <article className="policy-item info-card" key={p.id}>
          <button className="policy-head" onClick={() => setOpen(open === p.id ? null : p.id)}>
            <span className="service-icon"><FileText size={18} /></span>
            <span className="policy-title">
              <strong>{t(tx(p.title_ar, p.title_en))}</strong>
              {p.category_ar || p.category_en ? <small>{t(tx(p.category_ar || "", p.category_en || ""))}</small> : null}
            </span>
          </button>
          {open === p.id ? (
            <div className="policy-body">
              {p.body_ar || p.body_en ? <p>{t(tx(p.body_ar || "", p.body_en || ""))}</p> : null}
              {p.file_url ? (
                <a className="btn btn-secondary" href={p.file_url} target="_blank" rel="noreferrer">
                  {t(tx("فتح الملف", "Open document"))}
                </a>
              ) : null}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function VacationPanel({ token, vacations, onDone, dateLocale }: {
  token: string; vacations: VacationPlan[]; onDone: () => void; dateLocale: string;
}) {
  const { t } = usePortal();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!start || !end) return setError(t(tx("اختر تاريخ البداية والنهاية.", "Choose start and end dates.")));
    if (end < start) return setError(t(tx("تاريخ النهاية قبل البداية.", "End date is before the start date.")));
    setBusy(true);
    setError("");
    const res = await nursingSubmitVacation(token, start, end, notes);
    setBusy(false);
    if (res?.status !== "ok") return setError(t(tx("تعذّر الإرسال.", "Could not submit.")));
    setStart(""); setEnd(""); setNotes("");
    onDone();
  };

  const fmt = (d: string) => {
    try { return new Intl.DateTimeFormat(dateLocale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(d)); }
    catch { return d; }
  };

  return (
    <div className="portal-two-col">
      <form className="portal-form info-card" onSubmit={submit}>
        <h3>{t(tx("تقديم خطة إجازة", "Submit a vacation plan"))}</h3>
        <label>{t(tx("من", "From"))}<input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label>{t(tx("إلى", "To"))}<input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
        <label>{t(tx("ملاحظات", "Notes"))}<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} dir="auto" /></label>
        {error ? <p className="field-error">{error}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          <CalendarPlus size={16} />
          {busy ? t(tx("جارٍ الإرسال…", "Submitting…")) : t(tx("إرسال للاعتماد", "Submit for approval"))}
        </button>
      </form>
      <div className="portal-list">
        <h3>{t(tx("طلباتي", "My requests"))}</h3>
        {vacations.length === 0 ? (
          <p className="muted">{t(tx("لا توجد طلبات بعد.", "No requests yet."))}</p>
        ) : (
          vacations.map((v) => (
            <div className="portal-list-row info-card" key={v.id}>
              <div>
                <strong>{fmt(v.start_date)} → {fmt(v.end_date)}</strong>
                {v.days ? <small className="muted"> · {v.days} {t(tx("يوم", "days"))}</small> : null}
                {v.manager_note ? <p className="muted">{v.manager_note}</p> : null}
              </div>
              <span className={`badge ${STATUS_TONE[v.status] || "badge-muted"}`}>{t(statusLabel(v.status))}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ProfilePanel({ token, profile, onDone }: { token: string; profile: ProfileItem[]; onDone: () => void }) {
  const { t } = usePortal();
  const [form, setForm] = useState({ kind: "certificate", title: "", issuer: "", issued: "", expiry: "", file: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return setError(t(tx("العنوان مطلوب.", "Title is required.")));
    setBusy(true);
    setError("");
    const res = await nursingAddProfileItem(token, {
      kind: form.kind, title: form.title.trim(), issuer: form.issuer.trim() || undefined,
      issued: form.issued || null, expiry: form.expiry || null, file: form.file.trim() || null
    });
    setBusy(false);
    if (res?.status !== "ok") return setError(t(tx("تعذّر الإضافة.", "Could not add.")));
    setForm({ kind: "certificate", title: "", issuer: "", issued: "", expiry: "", file: "" });
    onDone();
  };

  return (
    <div className="portal-two-col">
      <form className="portal-form info-card" onSubmit={submit}>
        <h3>{t(tx("إضافة وثيقة مهنية", "Add a professional document"))}</h3>
        <label>{t(tx("النوع", "Type"))}
          <select value={form.kind} onChange={set("kind")}>
            {Object.entries(KIND_LABEL).map(([k, label]) => <option key={k} value={k}>{t(label)}</option>)}
          </select>
        </label>
        <label>{t(tx("العنوان", "Title"))}<input value={form.title} onChange={set("title")} dir="auto" /></label>
        <label>{t(tx("الجهة المانحة", "Issuer"))}<input value={form.issuer} onChange={set("issuer")} dir="auto" /></label>
        <label>{t(tx("تاريخ الإصدار", "Issued"))}<input type="date" value={form.issued} onChange={set("issued")} /></label>
        <label>{t(tx("تاريخ الانتهاء", "Expiry"))}<input type="date" value={form.expiry} onChange={set("expiry")} /></label>
        <label>{t(tx("رابط الملف (اختياري)", "File link (optional)"))}<input value={form.file} onChange={set("file")} dir="auto" /></label>
        {error ? <p className="field-error">{error}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          <Plus size={16} />
          {busy ? t(tx("جارٍ الحفظ…", "Saving…")) : t(tx("إضافة للمراجعة", "Add for review"))}
        </button>
      </form>
      <div className="portal-list">
        <h3>{t(tx("وثائقي", "My documents"))}</h3>
        {profile.length === 0 ? (
          <p className="muted">{t(tx("لم تُضف وثائق بعد.", "No documents added yet."))}</p>
        ) : (
          profile.map((p) => (
            <div className="portal-list-row info-card" key={p.id}>
              <div>
                <strong>{p.title}</strong>
                <small className="muted"> · {t(KIND_LABEL[p.kind] || KIND_LABEL.other)}</small>
                {p.expiry_date ? <p className="muted">{t(tx("ينتهي", "Expires"))}: {p.expiry_date}</p> : null}
              </div>
              <span className={`badge ${STATUS_TONE[p.status] || "badge-muted"}`}>{t(statusLabel(p.status))}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ManagerPanel({ token }: { token: string }) {
  const { t } = usePortal();
  const [data, setData] = useState<ManagerOverview | null>(null);
  useEffect(() => {
    nursingManagerOverview(token).then((res) => res && setData(res));
  }, [token]);
  if (!data) return <p className="muted">{t(tx("جارٍ التحميل…", "Loading…"))}</p>;
  if (data.status !== "ok") return <p className="muted">{t(tx("غير مصرّح.", "Not authorized."))}</p>;
  return (
    <div className="manager-panel">
      <div className="portal-mini-stats">
        <div><strong>{data.staff.length}</strong><span>{t(tx("إجمالي الكادر", "Total staff"))}</span></div>
        <div><strong>{data.expiring.length}</strong><span>{t(tx("وثائق تنتهي خلال 60 يومًا", "Docs expiring ≤60 days"))}</span></div>
        <div><strong>{data.pending_vacations}</strong><span>{t(tx("إجازات معلّقة", "Pending vacations"))}</span></div>
        <div><strong>{data.pending_profile}</strong><span>{t(tx("وثائق معلّقة", "Pending documents"))}</span></div>
      </div>

      {data.expiring.length > 0 ? (
        <div className="manager-section">
          <h3><ShieldAlert size={18} /> {t(tx("وثائق قاربت على الانتهاء", "Credentials nearing expiry"))}</h3>
          <div className="admin-table-wrap info-card">
            <table className="admin-table">
              <thead><tr>
                <th>{t(tx("الموظف", "Staff"))}</th><th>{t(tx("القسم", "Dept"))}</th><th>{t(tx("الوثيقة", "Document"))}</th><th>{t(tx("الانتهاء", "Expiry"))}</th>
              </tr></thead>
              <tbody>
                {data.expiring.map((e, i) => (
                  <tr key={i}>
                    <td>{e.staff}</td><td>{e.department || "—"}</td>
                    <td>{e.title} <small className="muted">({t(KIND_LABEL[e.kind] || KIND_LABEL.other)})</small></td>
                    <td className="mono">{e.expiry_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="manager-section">
        <h3>{t(tx("كادر التمريض", "Nursing staff"))}</h3>
        <div className="admin-table-wrap info-card">
          <table className="admin-table">
            <thead><tr>
              <th>{t(tx("الاسم", "Name"))}</th><th>{t(tx("التخصص", "Specialty"))}</th><th>{t(tx("القسم", "Dept"))}</th><th>{t(tx("الجوال", "Phone"))}</th>
            </tr></thead>
            <tbody>
              {data.staff.map((s) => (
                <tr key={s.id}>
                  <td>{s.full_name}</td><td>{s.specialty || "—"}</td><td>{s.department || "—"}</td><td className="mono">{s.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function statusLabel(status: string) {
  const map: Record<string, ReturnType<typeof tx>> = {
    submitted: tx("مقدّم", "Submitted"),
    approved: tx("معتمد", "Approved"),
    returned: tx("مُعاد للتعديل", "Returned"),
    cancelled: tx("ملغى", "Cancelled"),
    pending: tx("قيد المراجعة", "Pending"),
    rejected: tx("مرفوض", "Rejected")
  };
  return map[status] || tx(status, status);
}

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}
