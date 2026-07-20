import { useEffect, useMemo, useState } from "react";
import { Award, CalendarClock, CheckCircle2, GraduationCap, Loader2, MapPin } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { usePageMeta } from "../../hooks/usePageMeta";
import { tx } from "../../utils/i18n";
import { fetchPublishedCourses, type TrainingCourse } from "../../lib/supabase/training";
import {
  checkIn,
  fetchTrainingConfig,
  markPrinted,
  resolveAttendance,
  submitFeedback,
  type CertFieldKey,
  type CourseWindow,
  type TrainingConfig
} from "../../lib/supabase/attendance";
import { CertificateView } from "./CertificateView";
import { FeedbackDialog } from "./FeedbackDialog";

type Saved = { id: string; name: string; emp: string; national: string };
const savedKey = (courseId: string) => `attend_${courseId}`;
function loadSaved(courseId: string): Saved | null {
  try {
    const raw = localStorage.getItem(savedKey(courseId));
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function useLocaleFmt() {
  const { locale } = usePortal();
  const loc = locale === "ar" ? "ar-SA" : "en-GB";
  return {
    dateTime: (iso: string | null) =>
      iso ? new Intl.DateTimeFormat(loc, { dateStyle: "full", timeStyle: "short" }).format(new Date(iso)) : "",
    time: (iso: string | null) =>
      iso ? new Intl.DateTimeFormat(loc, { timeStyle: "short" }).format(new Date(iso)) : "",
    date: (d: Date) => new Intl.DateTimeFormat(loc, { dateStyle: "long" }).format(d)
  };
}

function durationLabel(course: TrainingCourse, locale: string): string {
  if (!course.starts_at || !course.ends_at) return "";
  const mins = Math.round((new Date(course.ends_at).getTime() - new Date(course.starts_at).getTime()) / 60000);
  if (mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ar = h ? `${h} ساعة${m ? ` و${m} دقيقة` : ""}` : `${m} دقيقة`;
  const en = h ? `${h} hour${h > 1 ? "s" : ""}${m ? ` ${m} min` : ""}` : `${m} min`;
  return locale === "ar" ? ar : en;
}

export function AttendancePage() {
  const { t, locale, isRtl } = usePortal();
  const fmt = useLocaleFmt();
  const [config, setConfig] = useState<TrainingConfig | null>(null);
  const [active, setActive] = useState<TrainingCourse | null>(null);
  const [win, setWin] = useState<CourseWindow | null>(null);
  const [upcoming, setUpcoming] = useState<TrainingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  usePageMeta(
    tx("تسجيل حضور الدورات | مستشفى الحديثة العام", "Course check-in | Hadetha General Hospital"),
    tx("سجّل حضورك للدورة واطبع شهادتك.", "Check in to the course and print your certificate.")
  );

  const load = async () => {
    const [cfg, courses] = await Promise.all([fetchTrainingConfig(), fetchPublishedCourses()]);
    const r = resolveAttendance(courses, cfg, Date.now());
    setConfig(cfg);
    setActive(r.active);
    setWin(r.window);
    setUpcoming(r.upcoming);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  /* Re-resolve every 30s so the page flips state (open → ended → past) live. */
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 30000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (config) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return (
    <div className="attend-page" dir={isRtl ? "rtl" : "ltr"}>
      <header className="attend-header">
        <GraduationCap size={22} />
        <span>{t(tx("الشؤون الأكاديمية والتدريب", "Academic Affairs & Training"))}</span>
      </header>

      <main className="attend-main">
        {loading ? (
          <div className="attend-loading">
            <Loader2 className="spin" size={26} />
          </div>
        ) : active && win && config ? (
          <AttendanceCard
            course={active}
            win={win}
            config={config}
            fmt={fmt}
            durationText={durationLabel(active, locale)}
          />
        ) : (
          <NoActiveCourse upcoming={upcoming} fmt={fmt} />
        )}
      </main>

      <footer className="attend-footer">{t(tx("مستشفى الحديثة العام — تجمع الجوف الصحي", "Hadetha General Hospital — Al-Jouf Health Cluster"))}</footer>
    </div>
  );
}

function AttendanceCard({
  course,
  win,
  config,
  fmt,
  durationText
}: {
  course: TrainingCourse;
  win: CourseWindow;
  config: TrainingConfig;
  fmt: ReturnType<typeof useLocaleFmt>;
  durationText: string;
}) {
  const { t } = usePortal();
  const title = t(tx(course.title_ar, course.title_en));
  const [saved, setSaved] = useState<Saved | null>(() => loadSaved(course.id));
  const [name, setName] = useState(saved?.name ?? "");
  const [emp, setEmp] = useState(saved?.emp ?? "");
  const [national, setNational] = useState(saved?.national ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const { notify } = usePortal();

  const canPrint = win.state === "ended"; // certificate unlocks when the course ends

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !emp.trim()) {
      setError(t(tx("الاسم والرقم الوظيفي مطلوبان.", "Name and employee number are required.")));
      return;
    }
    setBusy(true);
    setError("");
    const res = await checkIn(course.id, name.trim(), national.trim(), emp.trim());
    setBusy(false);
    if (res.error || !res.id) {
      setError(res.error || t(tx("تعذّر التسجيل.", "Check-in failed.")));
      return;
    }
    const rec: Saved = { id: res.id, name: name.trim(), emp: emp.trim(), national: national.trim() };
    localStorage.setItem(savedKey(course.id), JSON.stringify(rec));
    setSaved(rec);
    notify(t(tx("تم تسجيل حضورك.", "You're checked in.")), "success");
  };

  const certValues: Record<CertFieldKey, string> = useMemo(
    () => ({
      name: saved?.name ?? "",
      employee_number: saved?.emp ?? "",
      course: title,
      duration: durationText,
      date: fmt.date(new Date())
    }),
    [saved, title, durationText, fmt]
  );

  const openCertificate = () => {
    setFeedbackOpen(true);
  };

  return (
    <article className="attend-card">
      {course.poster_url ? (
        <div className="attend-poster">
          <img src={course.poster_url} alt={title} />
        </div>
      ) : (
        <div className="attend-poster attend-poster-empty">
          <GraduationCap size={54} />
        </div>
      )}

      <div className="attend-body">
        <span className={`attend-state attend-state-${win.state}`}>
          {win.state === "open"
            ? t(tx("التسجيل مفتوح", "Check-in open"))
            : win.state === "ended"
            ? t(tx("انتهت الدورة", "Course ended"))
            : t(tx("قريبًا", "Soon"))}
        </span>
        <h1 className="attend-title">{title}</h1>

        <ul className="attend-meta">
          <li>
            <CalendarClock size={16} />
            {fmt.dateTime(course.starts_at)}
          </li>
          {durationText ? (
            <li>
              <Award size={16} />
              {t(tx("المدة:", "Duration:"))} {durationText}
            </li>
          ) : null}
          {course.location_ar || course.location_en ? (
            <li>
              <MapPin size={16} />
              {t(tx(course.location_ar || "", course.location_en || ""))}
            </li>
          ) : null}
        </ul>

        {saved ? (
          <div className="attend-done">
            <p className="attend-done-line">
              <CheckCircle2 size={18} />
              {t(tx("تم تسجيل حضورك", "You're checked in"))} — {saved.name}
            </p>
            {canPrint ? (
              <button type="button" className="btn btn-primary attend-cert-btn" onClick={openCertificate}>
                <Award size={18} />
                {t(tx("اطبع الشهادة", "Print certificate"))}
              </button>
            ) : (
              <button type="button" className="btn btn-primary attend-cert-btn" disabled>
                <Award size={18} />
                {t(tx("الشهادة تُفعّل بعد انتهاء الدورة", "Certificate unlocks when the course ends"))}
                {win.endAt ? ` · ${fmt.time(course.ends_at)}` : ""}
              </button>
            )}
          </div>
        ) : (
          <form className="attend-form" onSubmit={submit}>
            <label>
              {t(tx("الاسم الكامل", "Full name"))}
              <input value={name} onChange={(e) => setName(e.target.value)} dir="auto" autoComplete="name" />
            </label>
            <label>
              {t(tx("الرقم الوظيفي", "Employee number"))}
              <input value={emp} onChange={(e) => setEmp(e.target.value)} dir="auto" inputMode="numeric" />
            </label>
            <label>
              {t(tx("رقم الهوية (اختياري)", "National ID (optional)"))}
              <input value={national} onChange={(e) => setNational(e.target.value)} dir="auto" inputMode="numeric" />
            </label>
            {error ? <p className="attend-error">{error}</p> : null}
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? <Loader2 className="spin" size={16} /> : <CheckCircle2 size={16} />}
              {t(tx("تسجيل الحضور", "Check in"))}
            </button>
          </form>
        )}
      </div>

      {feedbackOpen ? (
        <FeedbackDialog
          onSkip={() => {
            setFeedbackOpen(false);
            setCertOpen(true);
          }}
          onSubmit={async (fb) => {
            if (saved) await submitFeedback(saved.id, fb);
            setFeedbackOpen(false);
            setCertOpen(true);
          }}
        />
      ) : null}

      {certOpen ? (
        <CertificateView
          config={config}
          values={certValues}
          onClose={() => setCertOpen(false)}
          onPrinted={() => saved && markPrinted(saved.id)}
        />
      ) : null}
    </article>
  );
}

function NoActiveCourse({
  upcoming,
  fmt
}: {
  upcoming: TrainingCourse[];
  fmt: ReturnType<typeof useLocaleFmt>;
}) {
  const { t } = usePortal();
  return (
    <div className="attend-empty">
      <span className="attend-empty-icon">
        <CalendarClock size={40} />
      </span>
      <h1>{t(tx("لا توجد دورة نشطة الآن", "No active course right now"))}</h1>
      <p>{t(tx("امسح الرمز مرة أخرى قبل بداية الدورة القادمة.", "Scan again shortly before the next course begins."))}</p>

      {upcoming.length > 0 ? (
        <div className="attend-upcoming">
          <h2>{t(tx("الدورات القادمة", "Upcoming courses"))}</h2>
          <ul>
            {upcoming.slice(0, 6).map((c) => (
              <li key={c.id}>
                <strong>{t(tx(c.title_ar, c.title_en))}</strong>
                <span>{fmt.dateTime(c.starts_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
