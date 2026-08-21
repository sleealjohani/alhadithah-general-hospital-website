import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CheckCircle2, ClipboardCopy, Loader2, Stethoscope } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { tx } from "../../utils/i18n";
import {
  bookableDates,
  fetchBookableClinics,
  fetchSlots,
  requestAppointment,
  shortTime,
  type AppointmentClinic,
  type Slot
} from "../../lib/supabase/appointments";

const NATIONALITIES = [
  tx("سعودي", "Saudi"),
  tx("مصري", "Egyptian"),
  tx("سوداني", "Sudanese"),
  tx("يمني", "Yemeni"),
  tx("سوري", "Syrian"),
  tx("أردني", "Jordanian"),
  tx("باكستاني", "Pakistani"),
  tx("هندي", "Indian"),
  tx("فلبيني", "Filipino"),
  tx("أخرى", "Other")
];

type Form = {
  clinicId: string;
  date: string;
  time: string;
  fullName: string;
  nationalId: string;
  nationality: string;
  phone: string;
  dob: string;
  dobCalendar: "gregorian" | "hijri";
  notes: string;
};

const EMPTY: Form = {
  clinicId: "",
  date: "",
  time: "",
  fullName: "",
  nationalId: "",
  nationality: "",
  phone: "",
  dob: "",
  dobCalendar: "gregorian",
  notes: ""
};

export function BookingForm({ onTrack }: { onTrack: () => void }) {
  const { t, locale, notify } = usePortal();
  const [clinics, setClinics] = useState<AppointmentClinic[] | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  useEffect(() => {
    fetchBookableClinics().then(setClinics);
  }, []);

  const clinic = useMemo(() => clinics?.find((c) => c.id === form.clinicId) ?? null, [clinics, form.clinicId]);
  const dates = useMemo(() => (clinic ? bookableDates(clinic) : []), [clinic]);

  /* Slots depend on clinic + date; refetch whenever either changes. */
  useEffect(() => {
    if (!form.clinicId || !form.date) {
      setSlots(null);
      return;
    }
    let live = true;
    setSlots(null);
    fetchSlots(form.clinicId, form.date).then((s) => live && setSlots(s));
    return () => {
      live = false;
    };
  }, [form.clinicId, form.date]);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  const dateLabel = (iso: string) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long"
    }).format(new Date(`${iso}T00:00:00`));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.clinicId || !form.date || !form.time) {
      setError(t(tx("اختر العيادة والتاريخ والوقت.", "Choose a clinic, date, and time.")));
      return;
    }
    if (!form.fullName.trim() || !form.nationalId.trim() || !form.phone.trim()) {
      setError(t(tx("الاسم ورقم الهوية والجوال مطلوبة.", "Name, ID number, and phone are required.")));
      return;
    }
    setBusy(true);
    const res = await requestAppointment({ ...form });
    setBusy(false);
    if (res.error || !res.reference) {
      const map: Record<string, string> = {
        slot_full: t(tx("عذرًا، اكتمل هذا الموعد. اختر وقتًا آخر.", "Sorry, that slot is full. Please pick another time.")),
        date_in_past: t(tx("لا يمكن الحجز في تاريخ سابق.", "You can't book a date in the past.")),
        clinic_unavailable: t(tx("هذه العيادة غير متاحة حاليًا.", "This clinic is currently unavailable.")),
        missing_fields: t(tx("أكمل البيانات المطلوبة.", "Please complete the required fields."))
      };
      setError(map[res.error ?? ""] ?? t(tx("تعذّر إرسال الطلب. حاول مرة أخرى.", "Couldn't submit the request. Please try again.")));
      return;
    }
    setReference(res.reference);
  };

  /* ---- Success screen ---- */
  if (reference) {
    return (
      <div className="appt-success" data-reveal>
        <span className="appt-success-icon">
          <CheckCircle2 size={46} />
        </span>
        <h2>{t(tx("تم إرسال طلبك بنجاح", "Your request has been sent"))}</h2>
        <p>
          {t(
            tx(
              "استلمنا طلب موعدك وسيقوم قسم التسجيل بمراجعته والتواصل معك قريبًا لتأكيد الموعد.",
              "We've received your appointment request. Our registration team will review it and contact you soon to confirm."
            )
          )}
        </p>

        <div className="appt-ref">
          <span>{t(tx("رقم الطلب", "Reference number"))}</span>
          <strong>{reference}</strong>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              navigator.clipboard?.writeText(reference);
              notify(t(tx("تم نسخ رقم الطلب.", "Reference copied.")), "success");
            }}
          >
            <ClipboardCopy size={16} />
            {t(tx("نسخ", "Copy"))}
          </button>
        </div>

        <p className="appt-success-hint">
          {t(tx("احتفظ بهذا الرقم لمتابعة أو تعديل موعدك لاحقًا.", "Keep this number to track or change your appointment later."))}
        </p>

        <div className="appt-success-actions">
          <button type="button" className="btn btn-primary" onClick={onTrack}>
            {t(tx("متابعة حالة الطلب", "Track my request"))}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setForm(EMPTY);
              setReference("");
            }}
          >
            {t(tx("حجز موعد آخر", "Book another appointment"))}
          </button>
        </div>
      </div>
    );
  }

  /* ---- Form ---- */
  return (
    <form className="appt-form" onSubmit={submit}>
      {/* Step 1 — clinic */}
      <section className="appt-step">
        <h2>
          <span className="appt-step-no">1</span>
          {t(tx("اختر العيادة", "Choose the clinic"))}
        </h2>
        {clinics === null ? (
          <p className="muted">{t(tx("جارٍ التحميل…", "Loading…"))}</p>
        ) : clinics.length === 0 ? (
          <p className="muted">{t(tx("لا توجد عيادات متاحة للحجز حاليًا.", "No clinics are open for booking right now."))}</p>
        ) : (
          <div className="appt-clinics">
            {clinics.map((c) => (
              <button
                type="button"
                key={c.id}
                className={`appt-clinic ${form.clinicId === c.id ? "is-active" : ""}`}
                onClick={() => set({ clinicId: c.id, date: "", time: "" })}
              >
                <Stethoscope size={20} />
                <strong>{t(tx(c.name_ar, c.name_en))}</strong>
                {c.description_ar || c.description_en ? (
                  <small>{t(tx(c.description_ar || "", c.description_en || ""))}</small>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Step 2 — date + time */}
      {clinic ? (
        <section className="appt-step">
          <h2>
            <span className="appt-step-no">2</span>
            {t(tx("اختر التاريخ والوقت", "Choose date and time"))}
          </h2>

          <label className="appt-field">
            {t(tx("التاريخ", "Date"))}
            <select value={form.date} onChange={(e) => set({ date: e.target.value, time: "" })}>
              <option value="">{t(tx("— اختر تاريخًا —", "— Select a date —"))}</option>
              {dates.map((d) => (
                <option key={d} value={d}>
                  {dateLabel(d)}
                </option>
              ))}
            </select>
          </label>

          {form.date ? (
            slots === null ? (
              <p className="muted">{t(tx("جارٍ تحميل الأوقات…", "Loading times…"))}</p>
            ) : slots.length === 0 ? (
              <p className="muted">{t(tx("لا توجد أوقات متاحة في هذا اليوم.", "No times available on this day."))}</p>
            ) : (
              <div className="appt-slots" role="radiogroup" aria-label={t(tx("الأوقات المتاحة", "Available times"))}>
                {slots.map((s) => {
                  const full = s.free <= 0;
                  const active = form.time === s.time;
                  return (
                    <button
                      type="button"
                      key={s.time}
                      role="radio"
                      aria-checked={active}
                      disabled={full}
                      className={`appt-slot ${active ? "is-active" : ""} ${full ? "is-full" : ""}`}
                      onClick={() => set({ time: s.time })}
                    >
                      {s.time}
                      {full ? <small>{t(tx("مكتمل", "Full"))}</small> : null}
                    </button>
                  );
                })}
              </div>
            )
          ) : null}
        </section>
      ) : null}

      {/* Step 3 — patient details */}
      {form.time ? (
        <section className="appt-step">
          <h2>
            <span className="appt-step-no">3</span>
            {t(tx("بيانات المريض", "Patient details"))}
          </h2>

          <div className="appt-grid">
            <label className="appt-field">
              {t(tx("الاسم الكامل", "Full name"))} <span className="appt-req">*</span>
              <input value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} dir="auto" autoComplete="name" />
            </label>

            <label className="appt-field">
              {t(tx("رقم الهوية / الإقامة", "National ID / Iqama"))} <span className="appt-req">*</span>
              <input
                value={form.nationalId}
                onChange={(e) => set({ nationalId: e.target.value.replace(/\D/g, "") })}
                inputMode="numeric"
                maxLength={10}
                dir="ltr"
              />
            </label>

            <label className="appt-field">
              {t(tx("الجنسية", "Nationality"))}
              <select value={form.nationality} onChange={(e) => set({ nationality: e.target.value })}>
                <option value="">{t(tx("— اختر —", "— Select —"))}</option>
                {NATIONALITIES.map((n) => (
                  <option key={n.en} value={t(n)}>
                    {t(n)}
                  </option>
                ))}
              </select>
            </label>

            <label className="appt-field">
              {t(tx("رقم الجوال", "Phone number"))} <span className="appt-req">*</span>
              <input
                value={form.phone}
                onChange={(e) => set({ phone: e.target.value.replace(/[^\d+]/g, "") })}
                inputMode="tel"
                dir="ltr"
                placeholder="05XXXXXXXX"
              />
            </label>

            <div className="appt-field appt-dob">
              <span>{t(tx("تاريخ الميلاد", "Date of birth"))}</span>
              <div className="appt-dob-row">
                <div className="appt-cal-toggle">
                  <button
                    type="button"
                    className={form.dobCalendar === "gregorian" ? "is-active" : ""}
                    onClick={() => set({ dobCalendar: "gregorian", dob: "" })}
                  >
                    {t(tx("ميلادي", "Gregorian"))}
                  </button>
                  <button
                    type="button"
                    className={form.dobCalendar === "hijri" ? "is-active" : ""}
                    onClick={() => set({ dobCalendar: "hijri", dob: "" })}
                  >
                    {t(tx("هجري", "Hijri"))}
                  </button>
                </div>
                {form.dobCalendar === "gregorian" ? (
                  <input type="date" value={form.dob} onChange={(e) => set({ dob: e.target.value })} max="2026-12-31" />
                ) : (
                  <input
                    value={form.dob}
                    onChange={(e) => set({ dob: e.target.value })}
                    placeholder={t(tx("مثال: 1411-10-03", "e.g. 1411-10-03"))}
                    inputMode="numeric"
                    dir="ltr"
                  />
                )}
              </div>
            </div>

            <label className="appt-field appt-field-wide">
              {t(tx("ملاحظات (اختياري)", "Notes (optional)"))}
              <textarea value={form.notes} onChange={(e) => set({ notes: e.target.value })} rows={2} dir="auto" />
            </label>
          </div>

          <div className="appt-summary">
            <strong>{t(tx("ملخص الطلب", "Request summary"))}</strong>
            <span>
              {t(tx(clinic!.name_ar, clinic!.name_en))} · {dateLabel(form.date)} · {shortTime(form.time)}
            </span>
          </div>

          {error ? (
            <p className="appt-error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn-primary appt-submit" disabled={busy}>
            {busy ? <Loader2 className="spin" size={18} /> : <CalendarCheck size={18} />}
            {t(tx("إرسال طلب الموعد", "Submit appointment request"))}
          </button>
        </section>
      ) : error ? (
        <p className="appt-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
