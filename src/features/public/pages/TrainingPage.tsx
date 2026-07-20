import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MapPin,
  PartyPopper,
  Presentation,
  UserPlus,
  Users
} from "lucide-react";
import { usePortal } from "../../../providers/PortalProvider";
import { PageHero } from "../../../components/ui/PageHero";
import { SectionHeading } from "../../../components/ui/SectionHeading";
import { Modal } from "../../../components/ui/Modal";
import { Skeleton } from "../../../components/ui/Skeleton";
import { usePageMeta } from "../../../hooks/usePageMeta";
import {
  fetchPublishedCourses,
  fetchPublishedMedia,
  submitHostRequest,
  submitRegistration,
  type TrainingCourse,
  type TrainingMedia
} from "../../../lib/supabase/training";
import { tx } from "../../../utils/i18n";

const AUDIENCE_LABEL = {
  employees: tx("للموظفين", "Employees"),
  public: tx("للعموم", "Public"),
  both: tx("للجميع", "Everyone")
} as const;

function useLocale() {
  const { locale } = usePortal();
  return locale === "ar" ? "ar-SA" : "en-GB";
}

function formatDate(value: string | null, locale: string) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
  } catch {
    return "";
  }
}

function formatTime(value: string | null, locale: string) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
  } catch {
    return "";
  }
}

/* -------------------------------------------------------------------------- */
/* Course poster card                                                          */
/* -------------------------------------------------------------------------- */

function CourseCard({ course, onRegister }: { course: TrainingCourse; onRegister: (c: TrainingCourse) => void }) {
  const { t } = usePortal();
  const locale = useLocale();
  const title = t(tx(course.title_ar, course.title_en));
  return (
    <article className="course-card info-card">
      <div className="course-poster">
        {course.poster_url ? (
          <img src={course.poster_url} alt="" loading="lazy" />
        ) : (
          <div className="course-poster-fallback" aria-hidden="true">
            <GraduationCap size={40} />
          </div>
        )}
        <span className={`badge course-audience audience-${course.audience}`}>{t(AUDIENCE_LABEL[course.audience])}</span>
      </div>
      <div className="course-body">
        <h3>{title}</h3>
        {course.starts_at ? (
          <p className="course-meta">
            <CalendarDays size={15} />
            <span>
              {formatDate(course.starts_at, locale)}
              {formatTime(course.starts_at, locale) ? ` · ${formatTime(course.starts_at, locale)}` : ""}
            </span>
          </p>
        ) : null}
        {course.location_ar || course.location_en ? (
          <p className="course-meta">
            <MapPin size={15} />
            <span>{t(tx(course.location_ar || "", course.location_en || ""))}</span>
          </p>
        ) : null}
        {course.lecturer_ar || course.lecturer_en ? (
          <p className="course-meta">
            <Presentation size={15} />
            <span>{t(tx(course.lecturer_ar || "", course.lecturer_en || ""))}</span>
          </p>
        ) : null}
        <button type="button" className="btn btn-primary course-register" onClick={() => onRegister(course)}>
          <UserPlus size={16} />
          {t(tx("سجّل في الدورة", "Register"))}
        </button>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Registration modal                                                          */
/* -------------------------------------------------------------------------- */

function RegistrationModal({ course, onClose }: { course: TrainingCourse; onClose: () => void }) {
  const { t } = usePortal();
  const locale = useLocale();
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", national_id: "", job_title: "", notes: "" });
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");
  const title = t(tx(course.title_ar, course.title_en));
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim()) {
      setError(t(tx("الاسم ورقم الجوال مطلوبان.", "Name and phone are required.")));
      return;
    }
    setState("saving");
    setError("");
    const result = await submitRegistration({
      course_id: course.id,
      course_title: title,
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      national_id: form.national_id.trim() || null,
      job_title: form.job_title.trim() || null,
      audience: course.audience,
      notes: form.notes.trim() || null
    });
    if (!result.ok) {
      setState("idle");
      setError(t(tx("تعذّر إرسال الطلب، حاول مرة أخرى.", "Could not submit, please try again.")));
      return;
    }
    setState("done");
  };

  return (
    <Modal title={title} onClose={onClose}>
      {state === "done" ? (
        <div className="modal-thanks">
          <PartyPopper size={40} />
          <h3>{t(tx("تم استلام تسجيلك", "Registration received"))}</h3>
          <p>
            {t(
              tx(
                "شكرًا لتسجيلك في الدورة. تم استلام طلبك وسيتم التواصل معك لتأكيد المقعد.",
                "Thanks for registering. Your request was received and we'll contact you to confirm your seat."
              )
            )}
          </p>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {t(tx("تم", "Done"))}
          </button>
        </div>
      ) : (
        <form className="modal-form" onSubmit={submit}>
          <p className="modal-course-meta">
            <CalendarDays size={15} /> {formatDate(course.starts_at, locale) || t(tx("موعد يُعلن لاحقًا", "Date to be announced"))}
          </p>
          <label>
            {t(tx("الاسم الكامل", "Full name"))} *
            <input value={form.full_name} onChange={set("full_name")} dir="auto" required />
          </label>
          <label>
            {t(tx("رقم الجوال", "Phone number"))} *
            <input value={form.phone} onChange={set("phone")} inputMode="tel" dir="auto" required />
          </label>
          <label>
            {t(tx("البريد الإلكتروني", "Email"))}
            <input value={form.email} onChange={set("email")} inputMode="email" dir="auto" />
          </label>
          <label>
            {t(tx("رقم الهوية", "National ID"))}
            <input value={form.national_id} onChange={set("national_id")} inputMode="numeric" dir="auto" />
          </label>
          <label>
            {t(tx("المسمى الوظيفي / الجهة", "Job title / organization"))}
            <input value={form.job_title} onChange={set("job_title")} dir="auto" />
          </label>
          <label className="modal-field-wide">
            {t(tx("ملاحظات", "Notes"))}
            <textarea value={form.notes} onChange={set("notes")} rows={2} dir="auto" />
          </label>
          {error ? <p className="field-error modal-field-wide">{error}</p> : null}
          <div className="modal-actions modal-field-wide">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t(tx("إلغاء", "Cancel"))}
            </button>
            <button type="submit" className="btn btn-primary" disabled={state === "saving"}>
              {state === "saving" ? t(tx("جارٍ الإرسال…", "Submitting…")) : t(tx("إرسال التسجيل", "Submit registration"))}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Host-a-course modal                                                         */
/* -------------------------------------------------------------------------- */

function HostModal({ onClose }: { onClose: () => void }) {
  const { t } = usePortal();
  const [form, setForm] = useState({
    lecturers: "",
    course_name: "",
    duration: "",
    audience: "employees",
    phone: "",
    email: "",
    preferred_date: "",
    notes: ""
  });
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");
  const set = (key: keyof typeof form) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.lecturers.trim() || !form.course_name.trim() || !form.phone.trim()) {
      setError(t(tx("اسم المحاضر واسم الدورة ورقم الجوال مطلوبة.", "Lecturer, course name and phone are required.")));
      return;
    }
    setState("saving");
    setError("");
    const result = await submitHostRequest({
      lecturers: form.lecturers.trim(),
      course_name: form.course_name.trim(),
      duration: form.duration.trim() || null,
      audience: form.audience,
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      preferred_date: form.preferred_date || null,
      notes: form.notes.trim() || null
    });
    if (!result.ok) {
      setState("idle");
      setError(t(tx("تعذّر إرسال الطلب، حاول مرة أخرى.", "Could not submit, please try again.")));
      return;
    }
    setState("done");
  };

  return (
    <Modal title={t(tx("طلب إقامة دورة في المستشفى", "Request to host a course"))} onClose={onClose}>
      {state === "done" ? (
        <div className="modal-thanks">
          <PartyPopper size={40} />
          <h3>{t(tx("تم استلام طلبك", "Request received"))}</h3>
          <p>
            {t(
              tx(
                "شكرًا لك. تم استلام طلب إقامة الدورة وهو الآن قيد المراجعة من إدارة الشؤون الأكاديمية والتدريب، وسيتم التواصل معك.",
                "Thank you. Your course hosting request was received and is under review by Academic Affairs & Training. We'll be in touch."
              )
            )}
          </p>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {t(tx("تم", "Done"))}
          </button>
        </div>
      ) : (
        <form className="modal-form" onSubmit={submit}>
          <label>
            {t(tx("اسم/أسماء المحاضر", "Lecturer name(s)"))} *
            <input value={form.lecturers} onChange={set("lecturers")} dir="auto" required />
          </label>
          <label>
            {t(tx("اسم الدورة", "Course name"))} *
            <input value={form.course_name} onChange={set("course_name")} dir="auto" required />
          </label>
          <label>
            {t(tx("مدة الدورة", "Duration"))}
            <input value={form.duration} onChange={set("duration")} placeholder={t(tx("مثال: ٣ ساعات / يومان", "e.g. 3 hours / 2 days"))} dir="auto" />
          </label>
          <label>
            {t(tx("الفئة المستهدفة", "Target audience"))}
            <select value={form.audience} onChange={set("audience")}>
              <option value="employees">{t(tx("الموظفون", "Employees"))}</option>
              <option value="public">{t(tx("العموم", "Public"))}</option>
              <option value="both">{t(tx("الجميع", "Everyone"))}</option>
            </select>
          </label>
          <label>
            {t(tx("رقم الجوال", "Phone number"))} *
            <input value={form.phone} onChange={set("phone")} inputMode="tel" dir="auto" required />
          </label>
          <label>
            {t(tx("البريد الإلكتروني", "Email"))}
            <input value={form.email} onChange={set("email")} inputMode="email" dir="auto" />
          </label>
          <label>
            {t(tx("التاريخ المقترح", "Preferred date"))}
            <input type="date" value={form.preferred_date} onChange={set("preferred_date")} />
          </label>
          <label className="modal-field-wide">
            {t(tx("تفاصيل إضافية", "Additional details"))}
            <textarea value={form.notes} onChange={set("notes")} rows={2} dir="auto" />
          </label>
          {error ? <p className="field-error modal-field-wide">{error}</p> : null}
          <div className="modal-actions modal-field-wide">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t(tx("إلغاء", "Cancel"))}
            </button>
            <button type="submit" className="btn btn-primary" disabled={state === "saving"}>
              {state === "saving" ? t(tx("جارٍ الإرسال…", "Submitting…")) : t(tx("إرسال الطلب", "Submit request"))}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Compact month calendar marking course days                                  */
/* -------------------------------------------------------------------------- */

function CourseCalendar({ courses, onPick }: { courses: TrainingCourse[]; onPick: (c: TrainingCourse) => void }) {
  const { t, locale } = usePortal();
  const dateLocale = useLocale();
  const dated = useMemo(() => courses.filter((c) => c.starts_at), [courses]);
  const [cursor, setCursor] = useState(() => {
    const next = dated.find((c) => new Date(c.starts_at as string).getTime() >= Date.now());
    return next ? new Date(next.starts_at as string) : new Date();
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const byDay = new Map<number, TrainingCourse[]>();
  dated.forEach((c) => {
    const d = new Date(c.starts_at as string);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      byDay.set(day, [...(byDay.get(day) ?? []), c]);
    }
  });

  const monthLabel = new Intl.DateTimeFormat(dateLocale, { month: "long", year: "numeric" }).format(first);
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(dateLocale, { weekday: "short" }).format(new Date(2024, 0, 7 + i))
  );

  return (
    <div className="course-calendar info-card">
      <div className="calendar-head">
        <button type="button" className="icon-button" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label={t(tx("الشهر السابق", "Previous month"))}>
          {locale === "ar" ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        <strong>{monthLabel}</strong>
        <button type="button" className="icon-button" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label={t(tx("الشهر التالي", "Next month"))}>
          {locale === "ar" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
      <div className="calendar-grid">
        {weekdays.map((w) => (
          <span className="calendar-weekday" key={w}>
            {w}
          </span>
        ))}
        {Array.from({ length: startWeekday }, (_, i) => (
          <span className="calendar-cell is-empty" key={`e${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dayCourses = byDay.get(day);
          if (!dayCourses) {
            return (
              <span className="calendar-cell" key={day}>
                {day}
              </span>
            );
          }
          return (
            <button
              type="button"
              className="calendar-cell has-course"
              key={day}
              onClick={() => onPick(dayCourses[0])}
              title={dayCourses.map((c) => t(tx(c.title_ar, c.title_en))).join(" · ")}
            >
              {day}
              <span className="calendar-dot" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export function TrainingPage() {
  const { t } = usePortal();
  const [courses, setCourses] = useState<TrainingCourse[] | null>(null);
  const [media, setMedia] = useState<TrainingMedia[]>([]);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [regCourse, setRegCourse] = useState<TrainingCourse | null>(null);
  const [hostOpen, setHostOpen] = useState(false);

  usePageMeta(
    tx("الشؤون الأكاديمية والتدريب | مستشفى الحديثة العام", "Academic Affairs & Training | Hadetha General Hospital"),
    tx(
      "دورات ومحاضرات المستشفى، التسجيل في المقاعد، وطلب إقامة الدورات.",
      "Hospital courses and lectures, seat registration, and course hosting requests."
    )
  );

  useEffect(() => {
    let active = true;
    fetchPublishedCourses().then((rows) => active && setCourses(rows));
    fetchPublishedMedia().then((rows) => active && setMedia(rows));
    return () => {
      active = false;
    };
  }, []);

  const list = courses ?? [];
  const now = Date.now();
  const upcoming = list.filter((c) => !c.starts_at || new Date(c.starts_at).getTime() >= now);
  const past = list.filter((c) => c.starts_at && new Date(c.starts_at).getTime() < now);
  const shown = tab === "upcoming" ? upcoming : past;

  return (
    <>
      <PageHero
        eyebrow={tx("الشؤون الأكاديمية والتدريب", "Academic Affairs & Training")}
        title={tx("التعليم الطبي المستمر في مستشفى الحديثة العام", "Continuing medical education at Hadetha General Hospital")}
        description={tx(
          "خدمتان رئيسيتان: الشؤون الأكاديمية للموظفين، والتدريب المفتوح للموظفين والعموم — دورات، محاضرات، وتسجيل مباشر.",
          "Two core services: Academic Affairs for staff, and open Training for staff and the public — courses, lectures, and instant registration."
        )}
      />

      {/* Two services */}
      <section className="section">
        <div className="container two-services">
          <article className="service-card">
            <span className="service-icon">
              <GraduationCap size={26} />
            </span>
            <span className="badge badge-info">{t(tx("للموظفين", "Employees"))}</span>
            <h2>{t(tx("الشؤون الأكاديمية", "Academic Affairs"))}</h2>
            <p>
              {t(
                tx(
                  "التدريب الأكاديمي، الامتيازات، وبرامج طلبة الطب والتدريب السريري للموظفين — قريبًا.",
                  "Academic training, privileging, and clinical rotation programs for staff — coming soon."
                )
              )}
            </p>
            <span className="service-soon">{t(tx("قيد الإعداد", "Coming soon"))}</span>
          </article>

          <article className="service-card is-active">
            <span className="service-icon">
              <Presentation size={26} />
            </span>
            <span className="badge course-audience audience-both">{t(tx("للموظفين والعموم", "Staff & Public"))}</span>
            <h2>{t(tx("التدريب", "Training"))}</h2>
            <p>
              {t(
                tx(
                  "دورات ومحاضرات مفتوحة للموظفين والعموم مع التسجيل المباشر، وإمكانية طلب إقامة دورة في المستشفى.",
                  "Open courses and lectures for staff and the public with instant registration, plus the option to request hosting a course."
                )
              )}
            </p>
            <div className="training-cta-row">
              <a className="btn btn-primary" href="#courses">
                {t(tx("استعرض الدورات", "Browse courses"))}
              </a>
              <a className="btn btn-secondary" href="/attend">
                {t(tx("تسجيل حضور دورة", "Course check-in"))}
              </a>
            </div>
          </article>
        </div>
      </section>

      {/* Courses + calendar */}
      <section className="section" id="courses">
        <div className="container">
          <SectionHeading
            eyebrow={tx("الدورات والمحاضرات", "Courses & Lectures")}
            title={tx("الدورات القادمة والسابقة", "Upcoming & past courses")}
            description={tx(
              "اضغط على أي دورة للتسجيل في مقعد. تُحدّث القائمة من لوحة التحكم أولًا بأول.",
              "Tap any course to register for a seat. The list is kept current from the control panel."
            )}
          />

          <div className="course-tabs tab-row" role="tablist">
            <button type="button" className={tab === "upcoming" ? "is-active" : ""} onClick={() => setTab("upcoming")}>
              {t(tx("القادمة", "Upcoming"))} {upcoming.length ? `(${upcoming.length})` : ""}
            </button>
            <button type="button" className={tab === "past" ? "is-active" : ""} onClick={() => setTab("past")}>
              {t(tx("السابقة", "Past"))} {past.length ? `(${past.length})` : ""}
            </button>
          </div>

          <div className="training-layout">
            <div className="training-courses">
              {courses === null ? (
                <div className="poster-grid">
                  <Skeleton variant="block" />
                  <Skeleton variant="block" />
                  <Skeleton variant="block" />
                </div>
              ) : shown.length > 0 ? (
                <div className="poster-grid">
                  {shown.map((course) => (
                    <CourseCard key={course.id} course={course} onRegister={setRegCourse} />
                  ))}
                </div>
              ) : (
                <div className="empty-state info-card">
                  <CalendarDays size={28} />
                  <p>
                    {tab === "upcoming"
                      ? t(tx("لا توجد دورات قادمة حاليًا. تابعنا لاحقًا.", "No upcoming courses right now. Check back soon."))
                      : t(tx("لا توجد دورات سابقة مسجلة بعد.", "No past courses recorded yet."))}
                  </p>
                </div>
              )}
            </div>

            <aside className="training-aside">
              <CourseCalendar courses={upcoming.length ? upcoming : list} onPick={setRegCourse} />
              <div className="host-cta info-card">
                <span className="service-icon">
                  <Users size={24} />
                </span>
                <h3>{t(tx("هل ترغب بإقامة دورة؟", "Want to host a course?"))}</h3>
                <p>
                  {t(
                    tx(
                      "يمكن لموظفي المستشفى طلب إقامة دورة أو محاضرة وحجز موعد لها.",
                      "Hospital staff can request to host a course or lecture and book a date."
                    )
                  )}
                </p>
                <button type="button" className="btn btn-primary" onClick={() => setHostOpen(true)}>
                  <Presentation size={16} />
                  {t(tx("احجز موعد دورة", "Book a course date"))}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Media gallery */}
      {media.length > 0 ? (
        <section className="section training-gallery-section">
          <div className="container">
            <SectionHeading
              eyebrow={tx("من فعالياتنا", "From our events")}
              title={tx("صور ومقاطع من الدورات والمحاضرات", "Photos & clips from courses and lectures")}
            />
            <div className="training-gallery">
              {media.map((item) => (
                <figure className="gallery-item" key={item.id}>
                  {item.media_type === "video" ? (
                    <video src={item.media_url} controls preload="metadata" />
                  ) : (
                    <img src={item.media_url} alt={t(tx(item.title_ar || "", item.title_en || ""))} loading="lazy" />
                  )}
                  {item.caption_ar || item.caption_en ? (
                    <figcaption>{t(tx(item.caption_ar || "", item.caption_en || ""))}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {regCourse ? <RegistrationModal course={regCourse} onClose={() => setRegCourse(null)} /> : null}
      {hostOpen ? <HostModal onClose={() => setHostOpen(false)} /> : null}
    </>
  );
}
