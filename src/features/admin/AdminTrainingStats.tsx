import { useEffect, useMemo, useState } from "react";
import { BarChart3, Download, GraduationCap, Star, Users, Award } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { exportRowsToExcel } from "../../lib/exports";
import { tx } from "../../utils/i18n";
import { fetchAllCourses, fetchRegistrations, type TrainingCourse, type TrainingRegistration } from "../../lib/supabase/training";
import { adminFetchAttendance, type AttendanceRecord } from "../../lib/supabase/attendance";

/* A course "counts as held" once its end (or start) is in the past. Drafts are
   excluded — they were never actually announced. */
function isHeld(course: TrainingCourse, now: number) {
  if (course.status === "draft") return false;
  const end = course.ends_at ?? course.starts_at;
  if (!end) return false;
  const ts = new Date(end).getTime();
  return Number.isFinite(ts) && ts < now;
}

function courseDate(course: TrainingCourse) {
  return course.starts_at ? course.starts_at.slice(0, 10) : "";
}

function hours(course: TrainingCourse) {
  if (!course.starts_at || !course.ends_at) return null;
  const a = new Date(course.starts_at).getTime();
  const b = new Date(course.ends_at).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return null;
  return (b - a) / 3.6e6;
}

const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Row = {
  course: TrainingCourse;
  title: string;
  date: string;
  held: boolean;
  registered: number;
  attended: number;
  certificates: number;
  rating: number | null;
  fill: number | null;
  showRate: number | null;
  trainingHours: number;
};

export function AdminTrainingStats() {
  const { t } = usePortal();
  const [courses, setCourses] = useState<TrainingCourse[] | null>(null);
  const [regs, setRegs] = useState<TrainingRegistration[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [year, setYear] = useState("all");
  const [audience, setAudience] = useState("all");
  const [scope, setScope] = useState<"held" | "all">("held");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAllCourses().then(setCourses);
    fetchRegistrations().then(setRegs);
    adminFetchAttendance().then(setAttendance);
  }, []);

  /* One pass per course, joining the three tables by course_id. Registrations
     can also be matched by title for legacy rows that never carried an id. */
  const rows = useMemo<Row[]>(() => {
    if (!courses) return [];
    const now = Date.now();
    const regById = new Map<string, number>();
    const regByTitle = new Map<string, number>();
    regs.forEach((r) => {
      if (r.course_id) regById.set(r.course_id, (regById.get(r.course_id) ?? 0) + 1);
      else if (r.course_title) regByTitle.set(r.course_title, (regByTitle.get(r.course_title) ?? 0) + 1);
    });

    const att = new Map<string, AttendanceRecord[]>();
    attendance.forEach((a) => {
      const list = att.get(a.course_id);
      if (list) list.push(a);
      else att.set(a.course_id, [a]);
    });

    return courses.map((course) => {
      const list = att.get(course.id) ?? [];
      const scores = list.map((a) => a.feedback_overall).filter((n): n is number => typeof n === "number");
      const registered =
        (regById.get(course.id) ?? 0) + (regByTitle.get(course.title_ar) ?? 0) + (regByTitle.get(course.title_en) ?? 0);
      const attended = list.length;
      const h = hours(course);
      return {
        course,
        title: t(tx(course.title_ar, course.title_en)),
        date: courseDate(course),
        held: isHeld(course, now),
        registered,
        attended,
        certificates: list.filter((a) => a.certificate_printed_at).length,
        rating: scores.length ? scores.reduce((s, n) => s + n, 0) / scores.length : null,
        fill: course.capacity ? Math.round((attended / course.capacity) * 100) : null,
        showRate: registered ? Math.round((attended / registered) * 100) : null,
        trainingHours: h ? h * attended : 0
      };
    });
  }, [courses, regs, attendance, t]);

  const years = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.date) set.add(r.date.slice(0, 4));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [rows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows
      .filter((r) => (scope === "held" ? r.held : true))
      .filter((r) => year === "all" || r.date.startsWith(year))
      .filter((r) => audience === "all" || r.course.audience === audience)
      .filter((r) => !term || r.title.toLowerCase().includes(term) || (r.course.lecturer_ar ?? "").toLowerCase().includes(term))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [rows, scope, year, audience, search]);

  const totals = useMemo(() => {
    const attended = filtered.reduce((s, r) => s + r.attended, 0);
    const registered = filtered.reduce((s, r) => s + r.registered, 0);
    const certificates = filtered.reduce((s, r) => s + r.certificates, 0);
    const rated = filtered.filter((r) => r.rating !== null);
    return {
      courses: filtered.length,
      attended,
      registered,
      certificates,
      trainingHours: Math.round(filtered.reduce((s, r) => s + r.trainingHours, 0)),
      avgPerCourse: filtered.length ? Math.round((attended / filtered.length) * 10) / 10 : 0,
      rating: rated.length ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length : null
    };
  }, [filtered]);

  /* Attendees per month, for the trend strip. */
  const trend = useMemo(() => {
    const map = new Map<string, { courses: number; attended: number }>();
    filtered.forEach((r) => {
      if (!r.date) return;
      const key = r.date.slice(0, 7);
      const bucket = map.get(key) ?? { courses: 0, attended: 0 };
      bucket.courses += 1;
      bucket.attended += r.attended;
      map.set(key, bucket);
    });
    const items = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12);
    const peak = Math.max(1, ...items.map(([, v]) => v.attended));
    return items.map(([key, v]) => {
      const month = Number(key.slice(5, 7)) - 1;
      return { key, label: t(tx(MONTHS_AR[month] ?? key, MONTHS_EN[month] ?? key)), ...v, height: Math.round((v.attended / peak) * 100) };
    });
  }, [filtered, t]);

  const topCourses = useMemo(() => {
    const list = [...filtered].filter((r) => r.attended > 0).sort((a, b) => b.attended - a.attended).slice(0, 6);
    const peak = Math.max(1, ...list.map((r) => r.attended));
    return list.map((r) => ({ ...r, width: Math.round((r.attended / peak) * 100) }));
  }, [filtered]);

  const exportRows = () =>
    exportRowsToExcel(
      "training-statistics",
      filtered.map((r) => ({
        Course: r.title,
        Date: r.date || "",
        Lecturer: r.course.lecturer_ar || r.course.lecturer_en || "",
        Audience: r.course.audience,
        Status: r.held ? "held" : r.course.status,
        Capacity: r.course.capacity ?? "",
        Registered: r.registered,
        Attended: r.attended,
        "Show rate %": r.showRate ?? "",
        "Fill rate %": r.fill ?? "",
        Certificates: r.certificates,
        "Avg rating": r.rating ? Math.round(r.rating * 10) / 10 : ""
      }))
    );

  if (courses === null) {
    return <div className="admin-panel muted">{t(tx("جارٍ التحميل…", "Loading…"))}</div>;
  }

  return (
    <>
      <div className="stats-tiles">
        <div>
          <GraduationCap size={18} />
          <strong>{totals.courses}</strong>
          <span>{scope === "held" ? t(tx("دورة أقيمت", "Courses held")) : t(tx("إجمالي الدورات", "Total courses"))}</span>
        </div>
        <div>
          <Users size={18} />
          <strong>{totals.attended}</strong>
          <span>{t(tx("إجمالي الحضور", "Total attendees"))}</span>
        </div>
        <div>
          <BarChart3 size={18} />
          <strong>{totals.avgPerCourse}</strong>
          <span>{t(tx("متوسط الحضور للدورة", "Average per course"))}</span>
        </div>
        <div>
          <Users size={18} />
          <strong>{totals.registered}</strong>
          <span>{t(tx("مقاعد محجوزة", "Seat registrations"))}</span>
        </div>
        <div>
          <Award size={18} />
          <strong>{totals.certificates}</strong>
          <span>{t(tx("شهادات صادرة", "Certificates issued"))}</span>
        </div>
        <div>
          <Star size={18} />
          <strong>{totals.rating ? `${Math.round(totals.rating * 10) / 10}/5` : "—"}</strong>
          <span>{t(tx("متوسط التقييم", "Average rating"))}</span>
        </div>
        <div>
          <BarChart3 size={18} />
          <strong>{totals.trainingHours}</strong>
          <span>{t(tx("ساعة تدريبية", "Training hours"))}</span>
        </div>
      </div>

      <div className="inbox-toolbar reg-filters">
        <label className="inbox-filter">
          {t(tx("النطاق", "Scope"))}
          <select value={scope} onChange={(e) => setScope(e.target.value as "held" | "all")}>
            <option value="held">{t(tx("الدورات المنعقدة", "Courses held"))}</option>
            <option value="all">{t(tx("كل الدورات", "All courses"))}</option>
          </select>
        </label>
        <label className="inbox-filter">
          {t(tx("السنة", "Year"))}
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="all">{t(tx("كل السنوات", "All years"))}</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <label className="inbox-filter">
          {t(tx("الفئة", "Audience"))}
          <select value={audience} onChange={(e) => setAudience(e.target.value)}>
            <option value="all">{t(tx("الجميع", "All"))}</option>
            <option value="employees">{t(tx("الموظفون", "Employees"))}</option>
            <option value="public">{t(tx("العموم", "Public"))}</option>
            <option value="both">{t(tx("الجميع (مشترك)", "Everyone"))}</option>
          </select>
        </label>
        <label className="inbox-filter">
          {t(tx("بحث", "Search"))}
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t(tx("اسم الدورة أو المحاضر", "Course or lecturer"))} dir="auto" />
        </label>
        <div className="inbox-toolbar-end">
          <button type="button" className="btn btn-secondary" disabled={filtered.length === 0} onClick={exportRows}>
            <Download size={16} />
            {t(tx("تصدير Excel", "Export Excel"))}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-panel muted">{t(tx("لا توجد بيانات مطابقة.", "No matching data."))}</div>
      ) : (
        <>
          <div className="stats-charts">
            <section className="admin-panel stats-chart">
              <h3>{t(tx("الحضور شهريًا", "Attendees by month"))}</h3>
              {trend.length === 0 ? (
                <p className="muted">{t(tx("لا توجد دورات مؤرخة.", "No dated courses."))}</p>
              ) : (
                <div className="stats-bars">
                  {trend.map((m) => (
                    <div key={m.key} className="stats-bar" title={`${m.courses} — ${m.attended}`}>
                      <em>{m.attended}</em>
                      <i style={{ height: `${Math.max(m.height, 3)}%` }} />
                      <span>{m.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="admin-panel stats-chart">
              <h3>{t(tx("الأعلى حضورًا", "Highest attendance"))}</h3>
              {topCourses.length === 0 ? (
                <p className="muted">{t(tx("لم يُسجَّل حضور بعد.", "No attendance recorded yet."))}</p>
              ) : (
                <ul className="stats-rank">
                  {topCourses.map((r) => (
                    <li key={r.course.id}>
                      <span className="stats-rank-name">{r.title}</span>
                      <span className="stats-rank-track"><i style={{ inlineSize: `${Math.max(r.width, 6)}%` }} /></span>
                      <strong>{r.attended}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="admin-panel admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t(tx("الدورة", "Course"))}</th>
                  <th>{t(tx("التاريخ", "Date"))}</th>
                  <th>{t(tx("المحاضر", "Lecturer"))}</th>
                  <th>{t(tx("المسجّلون", "Registered"))}</th>
                  <th>{t(tx("الحضور", "Attended"))}</th>
                  <th>{t(tx("نسبة الحضور", "Show rate"))}</th>
                  <th>{t(tx("السعة", "Capacity"))}</th>
                  <th>{t(tx("الشهادات", "Certificates"))}</th>
                  <th>{t(tx("التقييم", "Rating"))}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.course.id}>
                    <td>
                      {r.title}
                      {r.held ? null : <span className="badge badge-muted" style={{ marginInlineStart: 8 }}>{t(tx("لم تُقم بعد", "Not held"))}</span>}
                    </td>
                    <td className="mono">{r.date || "—"}</td>
                    <td>{r.course.lecturer_ar || r.course.lecturer_en || "—"}</td>
                    <td className="mono">{r.registered}</td>
                    <td className="mono"><strong>{r.attended}</strong></td>
                    <td className="mono">{r.showRate === null ? "—" : `${r.showRate}%`}</td>
                    <td className="mono">{r.course.capacity ? `${r.fill}% (${r.course.capacity})` : "—"}</td>
                    <td className="mono">{r.certificates}</td>
                    <td className="mono">{r.rating ? `${Math.round(r.rating * 10) / 10}/5` : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>{t(tx("الإجمالي", "Total"))}</strong></td>
                  <td colSpan={2} className="muted">{totals.courses} {t(tx("دورة", "courses"))}</td>
                  <td className="mono"><strong>{totals.registered}</strong></td>
                  <td className="mono"><strong>{totals.attended}</strong></td>
                  <td />
                  <td />
                  <td className="mono"><strong>{totals.certificates}</strong></td>
                  <td className="mono">{totals.rating ? `${Math.round(totals.rating * 10) / 10}/5` : "—"}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </>
  );
}
